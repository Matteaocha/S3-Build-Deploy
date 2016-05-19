# S3-Build-Deploy
Deploy a folder to an S3 bucket, with options to set cache control, prefix, profile, and without deploying unmodified files


### Installation

```
npm install -g s3-build-deploy
```


### Command-Line

```
s3-build-deploy --build 'directory-to-deploy' --bucket 'bucket-name'
```

Optional arguments (with examples):

```
--prefix 'subdirectory'
--cache '86400'
--profile 'default'
--region 'us-east-1'

```

(The 'cache' option sets the value to the header like so 'Cache-Control max-age=<value>')


### Disclaimer

This works fine for me on windows, but I'm being bad as hell and haven't written any tests for it. I'll get round to it.

Also, I know this is very similar to the 's3-deploy' package, but I was having issues with that package not handling subdirectories very well, and I also wanted it to only upload modified files, so I just rolled out my own.

Hope it works alright for you






