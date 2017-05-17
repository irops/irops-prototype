/**
* GetWindowsImageId: A Lambda function that looks up the latest Windows AMI ID
* for a given OS Variant and Region.
**/

var osNameToPattern = {
  'Windows Server 2016'                                  : 'Windows_Server-2016-English-Full-Base-*',
  'Windows Server 2016 with Containers'                  : 'Windows_Server-2016-English-Full-Containers-*',
  'Windows Server 2016 Nano'                             : 'Windows_Server-2016-English-Nano-Base-*',
  'Windows Server 2016 with SQL Server 2016 Express'     : 'Windows_Server-2016-English-Full-SQL_2016_SP1_Express-*',
  'Windows Server 2016 with SQL Server 2016 Web'         : 'Windows_Server-2016-English-Full-SQL_2016_SP1_Web-*',
  'Windows Server 2016 with SQL Server Standard'         : 'Windows_Server-2016-English-Full-SQL_2016_SP1_Standard-*',
  'Windows Server 2012 R2'                               : 'Windows_Server-2012-R2_RTM-English-64Bit-Base-*',
  'Windows Server 2012 R2 with SQL Server 2016 Express'  : 'Windows_Server-2012-R2_RTM-English-64Bit-SQL_2016_SP1_Express-*',
  'Windows Server 2012 R2 with SQL Server 2016 Web'      : 'Windows_Server-2012-R2_RTM-English-64Bit-SQL_2016_SP1_Web-*',
  'Windows Server 2012 R2 with SQL Server 2016 Standard' : 'Windows_Server-2012-R2_RTM-English-64Bit-SQL_2016_SP1_Standard-*',
  'Windows Server 2012 R2 with SQL Server 2014 Express'  : 'Windows_Server-2012-R2_RTM-English-64Bit-SQL_2014_SP2_Express-*',
  'Windows Server 2012 R2 with SQL Server 2014 Web'      : 'Windows_Server-2012-R2_RTM-English-64Bit-SQL_2014_SP2_Web-*',
  'Windows Server 2012 R2 with SQL Server 2014 Standard' : 'Windows_Server-2012-R2_RTM-English-64Bit-SQL_2014_SP2_Standard-*'
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
    Owners: ['amazon']
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
