var path = require( "path" );
var FSE = require( 'fs-extra' );
var $amdquery = path.join( "..", "amdquery" )

task( "default", function() {
	jake.logger.log( "jake build[*.js]                       build application and javascript" );
	jake.logger.log( "jake build                             default is build_config.js" );
	jake.logger.log( "jake jsdoc[default|amdquery]           build javascript api document" );
	jake.logger.log( "jake jsdoc                             default is amdquery" );
	jake.logger.log( "jake ui_css                            build css of widget-ui" );
} );

task( "build", {
	async: true
}, function( config ) {
	if ( !config ) {
		config = "build_config.js";
	}
	jake.logger.log( "build application and javascript ..." );

	jake.exec( "node build.js " + config, {
		printStdout: true,
		printStderr: true
	}, complete );
} );

task( "ui_css", {
	async: true
}, function() {
	jake.logger.log( "build css of widget-ui ..." );

	jake.exec( "node buildWidgetUICSS.js", {
		printStdout: true,
		printStderr: true
	}, complete );
} );

desc( "It is inner. Build js api document." );
task( "jsdoc", {
	async: true
}, function( template ) {
	var $distPath = path.join( "../document/assets/api/" );
	var $template = path.join( "..", "jsdoc", "templates", template || "amdquery" );
	if ( FSE.exists( $template ) ) {
		jake.logger.warn( $template + " does not exist" );
		complete();
		return;
	}
	jake.rmRf( $distPath );
	jake.logger.log( "Build jsdoc ..." );
	jake.exec( [ "jsdoc", $amdquery, path.join( $amdquery, "**", "*.js" ), "--template", $template, "--destination", $distPath ].join( " " ), {
		printStdout: true,
		printStderr: true
	}, complete );
} );

desc( "It is inner. commit master." );
task( "master", [ "jsdoc", "build" ], {
	async: true
}, function( a ) {
	jake.exec(
    [
    "git stash",
    "git checkout master",
    "git stash pop"
    ], {
			printStdout: true,
			printStderr: true
		}, complete );
} );

desc( "It is inner. Publish gh-pages." );
task( "pages", {
	async: true
}, function( msg ) {
	jake.exec(
    [
    "git checkout gh-pages",
    "git merge master",
    "git push origin gh-pages",
    "git checkout master"
    ], {
			printStdout: true,
			printStderr: true
		}, complete );
	complete()
} );