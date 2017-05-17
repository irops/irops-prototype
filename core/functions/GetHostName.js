/**
* GetHostName: A Lambda function which converts Identifier
* Names into corresponding Codes, then combines them into
* HostNames which conform to Naming Conventions.
*
* The mapping tables in this file should be kept up-to-date
* as new Applications and Components are added.
**/

var companyNameToCode = {
  'Demo'   : 'demo',
  'Travel' : 'tvl'
};

var locationNameToCode = {
  'us-east-1'       : 'ue1',
  'us-east-2'       : 'ue2',
  'us-west-1'       : 'uw1',
  'us-west-2'       : 'uw2',
  'ca-central-1'    : 'cc1',
  'eu-west-1'       : 'ew1',
  'eu-central-1'    : 'ec1',
  'eu-west-2'       : 'ew2',
  'ap-southeast-1'  : 'as1',
  'ap-southeast-2'  : 'as2',
  'ap-northeast-2'  : 'an2',
  'ap-northeast-1'  : 'an1',
  'ap-south-1'      : 'ad1',
  'sa-east-1'       : 'se1',
  'Atlanta'         : 'atl',
  'Boston'          : 'bos',
  'Charlotte'       : 'clt',
  'Chicago'         : 'chi',
  'ColoradoSprings' : 'cos',
  'Dallas'          : 'dfw',
  'Denver'          : 'den',
  'Houston'         : 'hou',
  'KansasCity'      : 'mkc',
  'LasVegas'        : 'las',
  'LosAngeles'      : 'lax',
  'Miami'           : 'mia',
  'Minneapolis'     : 'msp',
  'New York'        : 'nyc',
  'Phoenix'         : 'phx',
  'Portland'        : 'pdx',
  'Raleigh'         : 'rdu',
  'SanFrancisco'    : 'sfo',
  'SanJose'         : 'sjc',
  'SantaBarbara'    : 'sba',
  'Seattle'         : 'sea',
  'Tulsa'           : 'tul',
  'Washington'      : 'was'
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

var systemNameToCode = {
  'IROPS' : 'irops'
};

var applicationNameToCode = {
  'LinuxBastions'           : 'bl',
  'LinuxBastion'            : 'bl',
  'WindowsBastions'         : 'bw',
  'WindowsBastion'          : 'bw',
  'OpenVPN'                 : 'vpn',
  'OpenVPNAS'               : 'vpn',
  'WebSphereMQ'             : 'wmq',
  'RabbitMQ'                : 'rmq',
  'MongoDB'                 : 'mdb',
  'Engine'                  : 'eng',
  'ActiveDirectory'         : 'ad',
  'DataTransfer'            : 'dt',
  'FederatedSecurity'       : 'fs',
  'CentralDatabase'         : 'cdb',
  'PAX'                     : 'pax',
  'SiteScope'               : 'ss',
  'Octopus'                 : 'oct',
  'LinuxWebServer'          : 'lws',
  'LinuxWebServers'         : 'mlws',
  'NestedLinuxWebServer'    : 'nlws',
  'NestedLinuxWebServers'   : 'mnlws',
  'WindowsWebServer'        : 'wws',
  'WindowsWebServers'       : 'mwws',
  'NestedWindowsWebServer'  : 'nwws',
  'NestedWindowsWebServers' : 'mnwws',
  'Magento'                 : 'mag'
};

var componentNameToCode = {
  'Web'               : 'web',
  'Queue'             : 'que',
  'Calculation'       : 'cal',
  'DataStaging'       : 'stg',
  'Publishing'        : 'pub',
  'Monitoring'        : 'mon',
  'Logging'           : 'log',
  'MongoDB'           : 'mdb',
  'RabbitMQ'          : 'rmq',
  'Deploy'            : 'dep',
  'DomainController'  : 'dc',
  'SFTP'              : 'ftp',
  'PolicyServer'      : 'pol',
  'SecurityServer'    : 'sec',
  'Update'            : 'upd'
};

var responseData = {};

exports.handler = function(event, context) {
  console.log('Request body:\n' + JSON.stringify(event));

  if (event.RequestType == 'Delete') {
    sendResponse(event, context, 'SUCCESS');
    return;
  }

  responseData.CompanyCode = companyNameToCode[event.ResourceProperties.CompanyName];
  if (responseData.CompanyCode === undefined) {
    responseData = {Error: 'CompanyName invalid'};
    console.error(responseData.Error);
    sendResponse(event, context, 'FAILED', responseData);
    return;
  }
  responseData.LocationCode = locationNameToCode[event.ResourceProperties.LocationName];
  if (responseData.LocationCode === undefined) {
    responseData = {Error: 'LocationName invalid'};
    console.error(responseData.Error);
    sendResponse(event, context, 'FAILED', responseData);
    return;
  }
  responseData.EnvironmentCode = environmentNameToCode[event.ResourceProperties.EnvironmentName];
  if (responseData.EnvironmentCode === undefined) {
    responseData = {Error: 'EnvironmentName invalid'};
    console.error(responseData.Error);
    sendResponse(event, context, 'FAILED', responseData);
    return;
  }
  responseData.SystemCode = systemNameToCode[event.ResourceProperties.SystemName];
  if (responseData.SystemCode === undefined) {
    responseData.SystemCode = '';
  }
  responseData.ApplicationCode = applicationNameToCode[event.ResourceProperties.ApplicationName];
  if (responseData.ApplicationCode === undefined) {
    responseData = {Error: 'ApplicationName invalid'};
    console.error(responseData.Error);
    sendResponse(event, context, 'FAILED', responseData);
    return;
  }
  responseData.ComponentCode = componentNameToCode[event.ResourceProperties.ComponentName];
  if (responseData.ComponentCode === undefined) {
    responseData.ComponentCode = '';
  }

  responseData.HostName = responseData.CompanyCode + responseData.LocationCode + responseData.EnvironmentCode + responseData.SystemCode + responseData.ApplicationCode + responseData.ComponentCode;
  console.log('HostName: ' + responseData.HostName);

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
