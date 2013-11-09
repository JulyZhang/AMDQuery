 //需要安装 minimatch
 var buildConfig = {
   debug: false,
   amdqueryPath: '../amdquery/',
   projectRootPath: '../../',
   outputPath: 'output/',
   apps: {},
   defines: {},
   levelOfJSMin: 3,
   uglifyOptions: {
     strict_semicolons: false,
     mangle_options: {
       mangle: true,
       toplevel: false,
       defines: null,
       except: null,
       no_functions: false
     },
     squeeze_options: {
       make_seqs: true,
       dead_code: true,
       no_warnings: false,
       keep_comps: true,
       unsafe: false
     },
     gen_options: {
       indent_start: 0,
       indent_level: 4,
       quote_keys: false,
       space_colon: false,
       beautify: false,
       ascii_only: false,
       inline_script: false
     }
   }
 };

 var argvs = process.argv;

 var argvsMap = {
   "-d": function( ) {
     buildConfig.debug = true;
   }
 };

 var relativePath = process.argv[ 1 ].replace( /([\\\/])[^\\\/]*$/, '$1' );

 var buildConfigFile = process.argv[ 2 ];
 if ( buildConfigFile && /\.js/.test( buildConfigFile ) ) {
   if ( !( /^\.*\//.test( buildConfigFile ) ) ) {
     buildConfigFile = './' + buildConfigFile;
   }
   buildConfigFile = require( buildConfigFile );
   for ( var i in buildConfigFile ) {
     buildConfig[ i ] = buildConfigFile[ i ];
   }
 }



 var FSO = require( 'fs' );
 var PATH = require( 'path' );

 //Configurate oye.js
 amdqueryPath = buildConfig.amdqueryPath;

 //Configurate project root path
 projectRootPath = buildConfig.projectRootPath;

 //All build files will save to outputPath
 outputPath = relativePath + '../output/';

 var oye = require( './lib/oye.node.js' );

 oye.setPath( {
   'oyeModulePath': amdqueryPath,
   'projectRootPath': projectRootPath
 } );
 amdRequire = oye.require;
 amdDefine = oye.define;


 for ( var i = 2, len = argvs.length, fn; i < len; i++ ) {
   fn = argvsMap[ argvs[ i ] ];
   if ( fn ) {
     fn( argvs[ i ] );
   }
 }

 var logger = buildConfig.debug ? console.info : function( ) {};

 logger( relativePath );

 //Uglify
 var uglify = require( './lib/uglify/uglify-js.js' );
 var minify = function( content ) {
   return uglify( content, buildConfig.uglifyOptions );
 };

 var glob = require( "glob" );
 var async = require( "./lib/async.js" );

 var loadedModule = 'loaded' + ( -new Date( ) );
 var fileStack = {};
 fileStack[ loadedModule ] = {};
 var baseFileStack = [ ];
 var amdqueryContent = "";
 var AMDQueryJSPath = buildConfig.amdqueryPath + "amdquery.js";
 var AMDQueryJSRooPath = relativePath + buildConfig.amdqueryPath;

 function readBaseAMDQueryJS( next, result ) {
   oye.readFile( AMDQueryJSPath, function( content ) {
     amdqueryContent = content;
     next( null, content );
   } );
 }

 function buildDefines( content, next ) {

   if ( !buildConfig.defines ) {
     return next( null, {} );
   }
   var l = 0,
     i = 0,
     key;

   for ( key in buildConfig.defines ) {
     l++;
   }

   if ( l === 0 ) {
     next( null, {} );
   }
   //Process all defines
   var n = l,
     name,
     item,
     requireList,
     result = {

     },
     callback = function( name, list ) {
       n--;
       result[ name ] = list;
       if ( n <= 0 ) {
         next( null, result );
       }
     };

   for ( name in buildConfig.defines ) {
     item = buildConfig.defines[ name ];
     requireList = checkDirectory( item.directory );
     requireList.push( item.path );
     _buildjs( requireList, name, callback );
   }

 }

 function buildApps( result, next ) {

   if ( !buildConfig.apps ) {
     return next( null, {} );
   }
   var l = 0,
     key;
   for ( key in buildConfig.apps ) {
     l++;
   }
   if ( l === 0 ) {
     next( null, {} );
   }
   //Process all apps
   var n = l,
     appName,
     callback = function( ) {
       n--;

       if ( n <= 0 ) {
         next( null, null );
       }
     };

   for ( appName in buildConfig.apps ) {
     _buildjs( buildConfig.apps[ appName ], appName, callback );
   }

 }

 function saveDefinesFile( result, next ) {
   var dirPath = buildConfig.outputPath + "defines/",
     list,
     i = 0,
     len,
     p,
     readFileCallback = function( err ) {
       if ( err ) {
         throw err;
       }
     },
     allFile,
     minFile,
     content,
     minContent,
     name;

   mkdirSync( dirPath );

   for ( name in result ) {
     list = result[ name ];
     len = list.length;
     name = name.replace( /^\/+/, '' );
     path = dirPath + name.replace( /[^\/]*$/, '' );
     allPath = dirPath + name + '.all.js';
     minPath = dirPath + name + '.min.js';

     content = list.join( "\r\n" );
     minContent = minifyContent( content );

     if ( minContent ) {
       FSO.writeFile( allPath, content, readFileCallback );
       console.log( '\r\nSave defines file: ' + allPath );
     }
     FSO.writeFile( minPath, minContent, readFileCallback );
     console.log( '\r\nSave defines file: ' + minPath );
   }

 }

 function main( ) {
   async.waterfall( [
    readBaseAMDQueryJS,
    buildDefines,
    saveDefinesFile ], function( err, result ) {
     if ( err ) {
       throw err;
     }
     switch ( result ) {

     }
   } );
 }

 var _buildjs = function( modules, name, callback ) {
   oye.require( modules, function( Module ) { //Asynchronous
     var
     args = arguments,
       len = args.length,
       i = 0,
       module,
       dependencies,
       list = [ ];

     for ( ; i < len; i++ ) {
       module = args[ i ];
       dependencies = module.getDependenciesMap( );
       list = list.concat( dependencies );
       console.info( '\u001b[34m' + '\r\nDependencies length of module ' + module._amdID + ': ' + dependencies.length + '\u001b[39m' );
     }

     list.sort( function( a, b ) {
       return a.index - b.index;
     } );
     var l = list.length;

     var item,
       moduleName, result = [ ],
       pathMap = {};

     for ( i = 0; i < l; i++ ) {
       item = list[ i ];

       if ( !pathMap[ item.path ] ) {
         result.push( editDefine( item.content, item.name ) );
         pathMap[ item.path ] = true;
       }
     }

     console.info( '\u001b[33m' + '\r\nthe defines "' + name + '" Dependencies length is ' + result.length + '\u001b[39m' );

     callback( name, result );
   } );
 };

 function minifyContent( content ) {
   try {
     var minContent = minify( content );
     return minContent;
   } catch ( e ) {
     var line = e.line,
       start = ( line > 10 ? line - 10 : 0 ),
       end = line + 10;
     //var line = e.line, start = 0, end = undefined;
     console.log( '\u001b[31m' + e.message + ' Line: ' + line + '\u001b[0m' );
     content = content.split( /(?:\r\n|[\r\n])/ ).slice( start, end );
     var errCode = [ ],
       lineNumber, code;
     for ( var i = 0; i < content.length; i++ ) {
       lineNumber = i + start + 1;
       code = ( lineNumber === line ) ? ( '\u001b[31m' + lineNumber + ' ' + content[ i ] + '\u001b[0m' ) : ( '\u001b[36m' + lineNumber + ' \u001b[32m' + content[ i ] + '\u001b[0m' );
       errCode.push( code );
     }
     console.log( errCode.join( '\r\n' ) );
     return null;
   }
 }

 function editDefine( content, module ) {
   content = "/*===================" + module + "===========================*/\r\n" + content;
   var r = /define\s*\(\s*(['"])[^\1]*\1/i;
   if ( !r.test( content ) ) {
     content = content.replace( /define\(/, 'define("' + module + '",' );
   }
   content += "\r\n\r\n/*=======================================================*/\r\n";
   logger( content );
   return content;
 }

 function mkdirSync( path ) {
   if ( !path || PATH.existsSync( path ) ) {
     return;
   }
   var r = /(?=[\\\/]+)/;
   var list = path.split( r );
   var l = list.length;
   var _path;
   for ( var i = 1; i < l; i++ ) {
     _path = list.slice( 0, i ).join( '' );
     if ( PATH.existsSync( _path ) ) {
       continue;
     }
     FSO.mkdirSync( _path );
   }
 }

 function checkDirectory( directoryList, suffix ) {
   suffix = suffix || "*.js";
   var result = [ ],
     i = 0,
     j = 0,
     k = 0,
     l = directoryList.length,
     m,
     n,
     globOpt,
     resultDirectory = [ ],
     directory,
     moduleAndDepends,
     content;
   for ( i = 0; i < l; i++ ) {
     directory = directoryList[ i ];
     globOpt = {
       cwd: AMDQueryJSRooPath + directory
     };
     resultDirectory = resultDirectory.concat( glob.sync( suffix, globOpt ) );
     for ( j = 0, m = resultDirectory.length; j < m; j++ ) {
       content = FSO.readFileSync( AMDQueryJSRooPath + directory + resultDirectory[ j ] );
       moduleAndDepends = oye.matchDefine( content.toString( ) );
       for ( k = 0, n = moduleAndDepends.length; k < n; k++ ) {
         if ( moduleAndDepends[ k ].module ) {
           result.push( moduleAndDepends[ k ].module );
         }

       }
     }
   }



   return result;
 }

 function forEach( obj, callback, context ) {
   if ( !obj ) return this;
   var i = 0,
     item, len = obj.length,
     isObj = typeof len != "number" || typeof obj == "function";
   if ( isObj ) {
     for ( item in obj )
       if ( callback.call( context || obj[ item ], obj[ item ], item ) === false ) break;
   } else
     for ( var value = obj[ 0 ]; i < len && callback.call( context || value, value, i ) !== false; value = obj[ ++i ] ) {}
   return this;
 }


 main( );