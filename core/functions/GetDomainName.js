/**
* GetDomainName: A Lambda function which converts Identifier
* Names into corresponding Codes, then combines them into
* DomainNames which conform to Naming Conventions.
*
* The mapping tables in this file should be kept up-to-date
* as new Applications and Components are added.
**/

var companyNameToCode = {
  'Demo'   : 'demo',
  'Travel' : 'tvl'
};

var environmentNameToCode = {
  'Production'  : 'p',
  'Staging'     : 's',
  'QA'          : 'q',
  'Testing'     : 't',
  'Development' : 'd',
  'Core'        : 'c',
  'Build'       : 'b',
  'Recovery'    : 'r',
  'Example'     : 'e'
};

var responseData = {};

exports.handler = function(event, context) {
  console.log('Request body:\n' + JSON.stringify(event));

  if (event.RequestType == 'Delete') {
    sendResponse(event, context, 'SUCCESS');
    return;
  }

  var parentDomainName = event.ResourceProperties.ParentDomainName;
  if (! /^([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9]?\.)+[A-Za-z]{2,6}$/.test(parentDomainName)) {
    responseData = {Error: 'ParentDomainName invalid'};
    console.error(responseData.Error);
    sendResponse(event, context, 'FAILED', responseData);
    return;
  }
  var companyCode = companyNameToCode[event.ResourceProperties.CompanyName];
  if (companyCode === undefined) {
    responseData = {Error: 'CompanyName invalid'};
    console.error(responseData.Error);
    sendResponse(event, context, 'FAILED', responseData);
    return;
  }
  var locationName = event.ResourceProperties.LocationName;
  if (! /^(us-east-1|us-east-2|us-west-1|us-west-2|ca-central-1|eu-west-1|eu-central-1|eu-west-2|ap-southeast-1|ap-southeast-2|ap-northeast-2|ap-northeast-1|ap-south-1|sa-east-1)$/.test(locationName)) {
    responseData = {Error: 'LocationName invalid'};
    console.error(responseData.Error);
    sendResponse(event, context, 'FAILED', responseData);
    return;
  }
  var environmentCode = environmentNameToCode[event.ResourceProperties.EnvironmentName];
  if (environmentCode === undefined) {
    responseData = {Error: 'EnvironmentName invalid'};
    console.error(responseData.Error);
    sendResponse.send(event, context, 'FAILED', responseData);
    return;
  }

  responseData.DomainName = ((environmentCode == 'p') ? '' : environmentCode + '.') + locationName + '.' + companyCode + '.' + parentDomainName;
  console.log('DomainName: ' + responseData.DomainName);

  sendResponse(event, context, 'SUCCESS', responseData);
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
