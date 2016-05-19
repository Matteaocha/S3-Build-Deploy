#!/usr/bin/env node

var aws = require('./lib/aws')
var argv = require('yargs').argv

aws.deploy(argv.build, argv.bucket, argv.prefix, argv.cache, argv.profile, argv.region, function (err) {
	if(err) console.log(err)
})

