/**
* GetRHELImageId: A Lambda function that looks up the latest RHEL AMI ID
* for a given OS Variant and Region.
**/

var osNameToPattern = {
  'RHEL 7'    : 'RHEL-7.*_HVM_GA-*',
  'RHEL 7.4'  : 'RHEL-7.4_HVM_GA-*',
  'RHEL 7.3'  : 'RHEL-7.3_HVM_GA-*',
  'RHEL 7.2'  : 'RHEL-7.2_HVM-*',
  'RHEL 7.1'  : 'RHEL-7.1_HVM-*',
  'RHEL 6'    : 'RHEL-6.*_HVM_GA-*',
  'RHEL 6.10' : 'RHEL-6.10_HVM_GA-*',
  'RHEL 6.9'  : 'RHEL-6.9_HVM_GA-*',
  'RHEL 6.8'  : 'RHEL-6.8_HVM_GA-*',
  'RHEL 6.7'  : 'RHEL-6.7_HVM-*',
  'RHEL 6.6'  : 'RHEL-6.6_HVM_GA-*'
};

exports.handler = function(event, context) {
  console.log('Request body:\\n' + JSON.stringify(event));

  if (event.RequestType == 'Delete') {
    sendResponse(event, context, 'SUCCESS');
    return;
  }

  var responseStatus = 'FAILED';
  var responseData = {};

  var osBaseName = osNameToPattern[event.ResourceProperties.OSName];
  console.log('OS: ' + event.ResourceProperties.OSName + ' -> ' + osBaseName);

  var aws = require('aws-sdk');

  var ec2 = new aws.EC2({region: event.ResourceProperties.Region});
  var describeImagesParams = {
    Filters: [{ Name: 'name', Values: [osBaseName]}],
    Owners: ['309956199498']
  };

  console.log('Calling DescribeImages...');
  ec2.describeImages(describeImagesParams, function(err, describeImagesResult) {
    if (err) {
      responseData = {Error: 'DescribeImages call failed'};
      console.error(responseData.Error + ':\\n', err);
    }
    else {
      var images = describeImagesResult.Images;
      console.log('DescribeImages returned ' + images.length + ' images');
      images.sort(function(x, y) { return x.CreationDate < y.CreationDate; });
      for (var i = 0; i < images.length; i++) {
        responseStatus = 'SUCCESS';
        responseData['ImageId'] = images[i].ImageId;
        responseData['Name'] = images[i].Name;
        console.log('Found: ' + images[i].Name + ', ' + images[i].ImageId);
        break;
      }
    }

    sendResponse(event, context, responseStatus, responseData);
  });
};

function sendResponse(event, context, responseStatus, responseData) {
  var responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });

  console.log('Response body:\n', responseBody);

  var https = require('https');
  var url = require('url');

  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length
    }
  };

  var request = https.request(options, function(response) {
    console.log('Status code: ' + response.statusCode);
    console.log('Status message: ' + response.statusMessage);
    context.done();
  });

  request.on('error', function(error) {
    console.log('send(..) failed executing https.request(..): ' + error);
    context.done();
  });

  request.write(responseBody);
  request.end();
}
