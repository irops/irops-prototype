/**
* A sample Lambda function that looks up the latest AMI ID for a given region and architecture.
**/

var archToAMINamePattern = {
  'PV64':  'amzn-ami-pv*x86_64-ebs',
  'HVM64': 'amzn-ami-hvm*x86_64-gp2',
  'HVMG2': 'amzn-ami-graphics-hvm*x86_64-ebs*'
};

exports.handler = function(event, context) {
  console.log('Request body:\n' + JSON.stringify(event));

  if (event.RequestType == 'Delete') {
      sendResponse(event, context, 'SUCCESS');
      return;
  }

  var responseStatus = 'FAILED';
  var responseData = {};

  var aws = require('aws-sdk');

  var ec2 = new aws.EC2({region: event.ResourceProperties.Region});
  var describeImagesParams = {
    Filters: [{ Name: 'name', Values: [archToAMINamePattern[event.ResourceProperties.Architecture]]}],
    Owners: [event.ResourceProperties.Architecture == 'HVMG2' ? '679593333241' : 'amazon']
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
      images.sort(function(x, y) { return y.Name.localeCompare(x.Name); });
      for (var i = 0; i < images.length; i++) {
        if (isBeta(images[i].Name)) continue;
        responseStatus = 'SUCCESS';
        responseData['ImageId'] = images[j].ImageId;
        responseData['Name'] = images[i].Name;
        console.log('Found: ' + images[i].Name + ', ' + images[i].ImageId);
        break;
      }
    }

    sendResponse(event, context, responseStatus, responseData);
  });
};

function isBeta(imageName) {
  return imageName.toLowerCase().indexOf('beta') > -1 || imageName.toLowerCase().indexOf('.rc') > -1;
}

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

  console.log('Sending response...\n');

  var request = https.request(options, function(response) {
    console.log('STATUS: ' + response.statusCode);
    console.log('HEADERS: ' + JSON.stringify(response.headers));
    context.done();
  });

  request.on('error', function(error) {
    console.error('sendResponse Error:' + error);
    context.done();
  });

  request.write(responseBody);
  request.end();
}
