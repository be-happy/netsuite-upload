let vscode = require('vscode');
let RestClient = require('node-rest-client').Client;
let OAuth = require('oauth-1.0a');
let crypto = require('crypto');



function getAuthorizationHeader(method) {
    var nsUpload = vscode.workspace.getConfiguration('netSuiteUpload');
    var NLAuth = nsUpload.authentication;
    if (NLAuth) {
        return NLAuth;
    }

    var tba = nsUpload.tokenBasedAuthentication;

    var oauth = OAuth({
        consumer: tba.consumer,
        signature_method: 'HMAC-SHA256',
        hash_function(base_string, key) {
            return crypto.createHmac('sha256', key).update(base_string).digest('base64');
        }
    });

    var request_data = {
        url: nsUpload.restlet,
        method: method
    };

    var header = oauth.toHeader(oauth.authorize(request_data, tba.token));
    return header.Authorization + ', realm="' +tba.realm + '"';
}

function getRelativePath(absFilePath) {
    var rootDirectory = vscode.workspace.getConfiguration('netSuiteUpload')['rootDirectory'];
    if (rootDirectory) {
        return rootDirectory + absFilePath.slice(vscode.workspace.rootPath.length);
    } else {   
        return 'SuiteScripts' + absFilePath.slice(vscode.workspace.rootPath.length);
    }
}

function getFile(file, callback) {
    getData('file', file.fsPath, callback);
}

function getDirectory(directory, callback) {
    getData('directory', directory.fsPath, callback);
}

function getData(type, objectPath, callback) {
    var relativeName = getRelativePath(objectPath);
    
    var client = new RestClient();
    var args = {
        path: { name: relativeName },
        headers: {                
            "Content-Type": "application/json",
            "Authorization": getAuthorizationHeader('GET')
        }
    };

    var baseRestletURL = vscode.workspace.getConfiguration('netSuiteUpload')['restlet'];
    client.get(baseRestletURL + '&type=' + type + '&name=${name}', args, function (data) {
        callback(data);
    });
}

function postFile(file, content, callback) {
    postData('file', file.fsPath, content, callback);
}

function postData(type, objectPath, content, callback) {
    var relativeName = getRelativePath(objectPath);
    
    var client = new RestClient();
    var args = {
        headers: {                
            "Content-Type": "application/json",
            "Authorization": getAuthorizationHeader('POST')
        },
        data: {
            type: 'file',
            name: relativeName,
            content: content
        }
    };

    var baseRestletURL = vscode.workspace.getConfiguration('netSuiteUpload')['restlet'];
    client.post(baseRestletURL, args, function (data) {
        callback(data);
    });
}

function deleteFile(file, callback) {
    deletetData('file', file.fsPath, callback);
}

function deletetData(type, objectPath, callback) {
    var relativeName = getRelativePath(objectPath);
    
    var client = new RestClient();
    var args = {
        path: { name: relativeName },
        headers: {                
            "Content-Type": "application/json",
            "Authorization": getAuthorizationHeader('DELETE')
        }
    };

    var baseRestletURL = vscode.workspace.getConfiguration('netSuiteUpload')['restlet'];
    client.delete(baseRestletURL + '&type=' + type + '&name=${name}', args, function (data) {
        callback(data);
    });
}

exports.getRelativePath = getRelativePath;
exports.getFile = getFile;
exports.postFile = postFile;
exports.deleteFile = deleteFile;
exports.getDirectory = getDirectory;
