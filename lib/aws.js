var aws = require('aws-sdk'),
	async = require('async'),
	mime = require('mime'),
	glob = require('glob'),
	path = require('path'),
	fs = require('fs'),
	fileStuff = require(path.dirname(__filename) + '/fileStuff.js')()

var exports = {
	deploy : deploy,
	getDeployableFiles : getDeployableFiles,
	doUpload : doUpload,
	getBucketObjects : getBucketObjects,
	shouldBeUploaded : shouldBeUploaded
}

module.exports = exports

//------------------------------------------------------------

function deploy(directory, bucket, prefix, cache, profile, region, cb) {

	try{

		if(!directory) return cb("No directory specified")
		if(!bucket) return cb("No bucket specified")
	
		if(!region) region = 'us-east-1'
		aws.config.region = region

		if(profile) {
			var creds = new aws.SharedIniFileCredentials({profile: profile});
			aws.config.credentials = creds	
		}
			
		var s3 = new aws.S3()		
		
		exports.getBucketObjects(s3, bucket, function(err, data){
		
			if(err) {
				cb(err)
				return
			}
			
			var objects = data
			
			try{
				var deployableFiles = exports.getDeployableFiles(directory)
			}
			catch(err){
				cb(err)
				return
			}
			
			if(prefix) {
				prefix += "/"
			}
			else {
				prefix = ""
			}
			var cacheControl = ( !!cache ? "max-age=" + cache : null)
			
			async.each(deployableFiles, function(file, cb){
			
				if(exports.shouldBeUploaded(objects, file, prefix)){
					var filekey = prefix + file.key
					exports.doUpload(bucket, file.path, filekey, cacheControl, s3, cb) 
				}
				else {
					cb()
				}				
			},
			function(err) {
				if(err) cb(err)
				else {
					console.log("")
					console.log("DONE DEPLOYING")
					console.log("")
					cb()
				}
			})
		})	
	}
	catch(err) {
		cb(err)
		return
	}
}

function getBucketObjects(s3, bucketName, cb){
	s3.listObjects({Bucket:bucketName}, function(err, data){
	
		if(err) {
			cb(err)
			return
		}
		
		var objects = []
		
		for(var i in data.Contents){
			objects.push({
				key: data.Contents[i].Key, 
				lastModified: (new Date(data.Contents[i].LastModified)).getTime()
			})
		}

		cb(null, objects)
	})
}

function shouldBeUploaded(objects, file, prefix) {

	var fullKey = prefix + file.key
	var lastModified

	for(var i in objects){
		if(objects[i].key === fullKey) {
			lastModified = objects[i].lastModified
			break
		}
	}
	
	if(lastModified === undefined) {
		return true
	}
	else {
		return fileStuff.fileIsNewer(file.path, lastModified)
	}
}

function doUpload(bucket, filePath, key, cacheControl, s3, cb) {
	console.log("Uploading file: ", key)			
			
	var params = {	Bucket: bucket, 
					Key: key, 
					ContentType: mime.lookup(filePath),
					Body: fs.createReadStream(filePath),
					ACL: 'public-read'
				}

	if(cacheControl) {
		params.CacheControl = cacheControl
	}
	
	s3.upload(params, {}, function(err, data){
		if(err) cb(err)
		else {
			console.log("Finished uploading: ", key)
			cb()
		}
	})	
}


function getDeployableFiles(directory) {

	var distDirectory = path.normalize(directory)
	if(distDirectory !== "") distDirectory += "/"
	

	var allFiles = glob.sync(distDirectory + '**')
	var result = []
	
	for(var i in allFiles){
		if(!fileStuff.fileIsDirectory(allFiles[i])) {
			var key = path.relative(distDirectory, allFiles[i]).replace(/\\/g, '/')
			result.push({"path" : allFiles[i], "key" : key})
		}		
	}
	return result
}


