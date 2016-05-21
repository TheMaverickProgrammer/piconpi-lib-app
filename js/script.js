// Mixing jQuery and Node.js code in the same file? Yes please!

$(function(){
	// Display some statistic about this computer, using node's os module.

	var os = require('os');
	var prettyBytes = require('pretty-bytes');
	var fs = require('fs');
	var path = require('path');
	var async = require('async');
	const HOME_DIR = process.env.HOME;

  $('.stats').append('PiCon Pi Game Library <span>v0.0.3</span>');
	$('.stats').append('<br />Number of cpu cores on device: <span>' + os.cpus().length + '</span>');
	$('.stats').append('Free memory on device: <span>' + prettyBytes(os.freemem())+ '</span>');

	// Node webkit's native UI library. We will need it for later
	var gui = require('nw.gui');
  var ul = $('.flipster ul');

	// Script variables
	var lis = [];
	var LibDirs = [];
	var PPIFiles = [];

	// utilities
  function filterDirectories(rootDir, files, cb) {
		var dirs = [];
		for (index = 0; index < files.length; ++index) {
			file = files[index];

			// look for our unique '.ppi' extension
			ext = file.substring(file.lastIndexOf(".")+1);

			if (file[0] !== '.' && ext === 'ppi') {
				filePath = rootDir + '/' + file;
				fs.stat(filePath, function(err, stat) {
					if (stat.isDirectory()) {
							dirs.push(this.file);
					}
					if (files.length === (this.index + 1)) {
							return cb(dirs);
					}
				}.bind({index: index, file: file}));
			}
	 }
 }

 function createLi(dir, data) {
	var li = $('<li><img /><br /><a target="_blank"></a><div class="desc" style="display:none;"></div><div class="genre" style="display:none;"></div><div class="name" style="display:none;"></div></li>');
	var entryPath = HOME_DIR + '/picon-games/' + dir + '/' + data.entry;

	li.find('a')
	 	.attr('href', entryPath)
	 	.text(data.name);

	li.find('img').attr('src', "file:///" +  HOME_DIR + '/picon-games/' + dir + '/' + data.card).css('width:288px;height:105px;');

	li.find('.desc').html(data.description);
  li.find('.name').html(data.name);
  li.find('.genre').html(data.type);

	return li;
 }

 // async discrete steps

 // Fetch the directory contents
 function readLibDirGetContents(next) {
	 fs.readdir(HOME_DIR + '/picon-games/', function(err, files) {
		if (err) {
		   return next(err);
		}

		LibDirs = files;

		next();
	 });
 }

  function filterByPPIFiles(next) {
	 //document.write(JSON.stringify(files));
	 filterDirectories(HOME_DIR + '/picon-games/', LibDirs, function(filterdDirs){
		 PPIFiles = filterdDirs;
		 next();
	 });
 	}

	function readAppManifestFilesByChunks(next) {
		var tasks = [];

		PPIFiles.forEach(function(dir){
			tasks.push(function task(nextTask) {
				fs.readFile(HOME_DIR + '/picon-games/' + dir + "/app.json", 'utf-8', function (err, data) {

				  if (err) {
				    nextTask(err);
				  }

		  		// Create a li item for every article, and append it to the unordered list
					lis.push(createLi(dir, JSON.parse(data)));
					nextTask();
				});
			});
		});

		var chunkSize = 4;
		async.parallelLimit(tasks, chunkSize, next);
	}

	function initFlipster(next) {
		lis.forEach(function(item, index, array){
			item.appendTo(ul);
		})
		// Initialize the flipster plugin
		$('.flipster').flipster({
			loop: false,
			start: 0,
			fadeIn: 2000, // milliseconds
			spacing: -0.4,
			style: 'carousel' // 'flat', 'carousel'
		});

		// TODO: open preview page with options
		$("a").on('click', function(e) {

			try {
				var entryPathRel = $(this).attr('href');
		    fs.accessSync(entryPathRel, fs.F_OK);
				// boot up game

				$('#audio-select').trigger('play');
				$('body').fadeOut(500, 'linear');

				var li = $(this).closest("li");

				setTimeout(function(){
					/*location.href = entryPathRel;
					localStorage.setItem("genre", li.find("div .genre").html());
					localStorage.setItem("name", li.find("div .name").html());
					localStorage.setItem("desc", li.find("div .desc").html());
					localStorage.setItem("href", entryPathRel);
					localStorage.setItem("card", li.find("img").attr("src"));*/

					location.href = "file:///" + entryPathRel;
				}, 500);
			} catch (e) {
				// It isn't accessible
				// Let user know
				$('#audio-select').trigger('stop');
				$('#audio-alert').trigger('play');

				swal({
				  title:"Cannot Play",
				  text: "Entry record not found or package is corrupted",
				  type: "error",
				  confirmButtonText: "OK"
				});
			}
		});

		// pressing enter triggers above click function
		$('.flipster').on('keydown', function( e ) {
		  var code = e.which;

		  if( code === 13 ) {
		    e.preventDefault();
				$('.flipster__item--current').find('a').trigger('click');
		    return false;
		  }
		})

		registerSoundEffects();
	}

	function registerSoundEffects() {
		// Add some sound effects
		$('.flipster').on('click', 'a', function (e) {

			e.preventDefault();

			//$('#audio-nav').trigger('play');

		});

		$('.flipster').on('keydown', function (e) {

			e.preventDefault();

			var code = e.which;

			// Left & right arrow key codes
			if( code === 37 || code === 39 ) {
				$('#audio-nav').trigger('play');
			}

		});
	}

	// execute async series process
	async.series([readLibDirGetContents, filterByPPIFiles, readAppManifestFilesByChunks, initFlipster]);

	// Other independant tasks

	// Fade out PiCon Pi splash screen
	$("#splash").fadeOut(2000, "linear", function(){
		$("#splash").remove();
	})

	$('#audio-menu').prop('volume', 0.5);

	// focus on div
	var e = $.Event('keydown');
	e.which = 9; // Tab
	$('.flipster').trigger(e)
});
