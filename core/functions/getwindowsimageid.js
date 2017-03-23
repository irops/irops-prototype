/**
* A sample Lambda function that looks up the latest Windows AMI ID
* for a given region and Windows AMI base name.
**/

var osNameToPattern = {
  'Windows Server 2008 SP2 English 32-bit': 'Windows_Server-2008-SP2-English-32Bit-Base-*',
  'Windows Server 2008 SP2 English 64-bit': 'Windows_Server-2008-SP2-English-64Bit-Base-*',
  'Windows Server 2008 R2 English 64-bit':  'Windows_Server-2008-R2_SP1-English-64Bit-Base-*',
  'Windows Server 2012 RTM English 64-bit': 'Windows_Server-2012-RTM-English-64Bit-Base-*',
  'Windows Server 2012 R2 English 64-bit':  'Windows_Server-2012-R2_RTM-English-64Bit-Base-*'
};

exports.handler = function(event, context) {
  console.log('Request body:\n' + JSON.stringify(event));

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
    Owners: ['amazon']
  };

  console.log('Calling DescribeImages...');
  ec2.describeImages(describeImagesParams, function(err, describeImagesResult) {
    if (err) {
      responseData = {Error: 'DescribeImages call failed'};
      console.error(responseData.Error + ':\n', err);
    }
    else {
      var images = describeImagesResult.Images;
      console.log('DescribeImages returned ' + images.length + ' images');
      images.sort(function(x, y) { return x.CreationDate < y.CreationDate; });
      for (var i = 0; i < images.length; i++) {
        responseStatus = 'SUCCESS';
        responseData['ImageId'] = images[i].ImageId;
        responseData['Name'] = images[i].Name;
        console.log( 'Found: ' + images[i].Name + ', ' + images[i].ImageId);
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

  console.log('SENDING RESPONSE...\n');

  var request = https.request(options, function(response) {
    console.log('STATUS: ' + response.statusCode);
    console.log('HEADERS: ' + JSON.stringify(response.headers));
    context.done();
  });

  request.on('error', function(error) {
    console.log('sendResponse Error:' + error);
    context.done();
  });

  request.write(responseBody);
  request.end();
}
