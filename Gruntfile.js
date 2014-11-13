var parseBuildPlatforms = function (argumentPlatform) {
	var inputPlatforms = argumentPlatform || process.platform + ";" + process.arch;

	inputPlatforms = inputPlatforms.replace("darwin", "mac");
	inputPlatforms = inputPlatforms.replace(/;ia|;x|;arm/, "");

	var buildAll = /^all$/.test(inputPlatforms);
	var buildPlatforms = {
		mac: /mac/.test(inputPlatforms) || buildAll,
		win: /win/.test(inputPlatforms) || buildAll,
		linux32: /linux32/.test(inputPlatforms) || buildAll,
		linux64: /linux64/.test(inputPlatforms) || buildAll
	};

	return buildPlatforms;
};

module.exports = function (grunt) {

	var buildPlatforms = parseBuildPlatforms(grunt.option('platforms'));
	var pkgJson = grunt.file.readJSON('package.json');
	var currentVersion = pkgJson.version;

	require('load-grunt-tasks')(grunt);

	grunt.registerTask('default', [
		'css',
		'jshint',
		'bower_clean'
	]);

	// Called from the npm hook
	grunt.registerTask('setup', [
	]);

	grunt.registerTask('css', []);

	grunt.registerTask('build', [
		'css',
		'bower_clean',
		'nodewebkit',
		'shell:setexecutable'
	]);

	grunt.registerTask('dist', [
		'clean:releases',
		'clean:dist',
		'clean:update',
		'build',
		'exec:pruneProduction',
		'package' // all platforms
	]);

	grunt.registerTask('start', function () {
		var start = parseBuildPlatforms();
		if (start.win) {
			grunt.task.run('exec:win');
		} else if (start.mac) {
			grunt.task.run('exec:mac');
		} else if (start.linux32) {
			grunt.task.run('exec:linux32');
		} else if (start.linux64) {
			grunt.task.run('exec:linux64');
		} else {
			grunt.log.writeln('OS not supported.');
		}
	});

	grunt.registerTask('package', [
		'shell:packageLinux64',
		'shell:packageLinux32',
		'shell:packageWin',
		'shell:packageMac'
	]);

	grunt.initConfig({
		githooks: {
			all: {
				'pre-commit': 'jsbeautifier:jshint',
			}
		},

		nodewebkit: {
			options: {
        appName: 'Teamwall',
        appVersion: '0.0.1',
				version: '0.9.2',
				build_dir: './build', // where the build version of my node-webkit app is saved
				keep_nw: true,
				embed_nw: false,
				macZip: buildPlatforms.win, // prevent path too long if build all is used.
				mac: buildPlatforms.mac,
				win: buildPlatforms.win,
				linux32: buildPlatforms.linux32,
				linux64: buildPlatforms.linux64
			},
			src: ['./src/**', './node_modules/**', '!./node_modules/bower/**',
        '!./node_modules/*grunt*/**', '!./**/test*/**', '!./**/doc*/**',
        '!./**/example*/**', '!./**/demo*/**', '!./**/bin/**', '!./**/build/**',
         '!./**/.*/**',
				'./package.json'
			]
		},

		exec: {
			win: {
				cmd: '"build/cache/win/<%= nodewebkit.options.version %>/nw.exe" .'
			},
			mac: {
				cmd: 'build/cache/mac/<%= nodewebkit.options.version %>/node-webkit.app/Contents/MacOS/node-webkit .'
			},
			linux32: {
				cmd: '"build/cache/linux32/<%= nodewebkit.options.version %>/nw" .'
			},
			linux64: {
				cmd: '"build/cache/linux64/<%= nodewebkit.options.version %>/nw" .'
			},
			pruneProduction: {
				cmd: 'npm prune --production'
			}
		},

		jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
			gruntfile: {
				src: 'Gruntfile.js'
			}
		},

		shell: {
			setexecutable: {
				command: [
					'pct_rel="build/Teamwall"',
					'chmod -R +x ${pct_rel}/osx/Teamwall.app || : ',
					'chmod +x ${pct_rel}/linux*/Teamwall/Teamwall || : '
				].join('&&')
			},
			packageLinux64: {
				command: [
					'cd build/releases/Teamwall/linux64/Teamwall',
					'tar --exclude-vcs -caf "../Teamwall-' + currentVersion + '-Linux-64.tar.xz" .',
					'echo "Linux64 Sucessfully packaged" || echo "Linux64 failed to package"'
				].join('&&')
			},
			packageLinux32: {
				command: [
					'cd build/releases/Teamwall/linux32/Teamwall',
					'tar --exclude-vcs -caf "../Teamwall-' + currentVersion + '-Linux-32.tar.xz" .',
					'echo "Linux32 Sucessfully packaged" || echo "Linux32 failed to package"'
				].join('&&')
			},
			packageWin: {
				command: [
					'cd build/releases/Teamwall/win/Teamwall',
					'tar --exclude-vcs -caf "../Teamwall-' + currentVersion + '-Win.tar.xz" .',
					'echo "Windows Sucessfully packaged" || echo "Windows failed to package"'
				].join('&&')
			},
			packageMac: {
				command: [
					'cd build/releases/Teamwall/mac/',
					'tar --exclude-vcs -caf "Teamwall-' + currentVersion + '-Mac.tar.xz" Teamwall.app',
					'echo "Mac Sucessfully packaged" || echo "Mac failed to package"'
				].join('&&')
			}
		},

		compress: {
			linux32: {
				options: {
					mode: 'tgz',
					archive: 'build/releases/Teamwall/linux32/Teamwall-' + currentVersion + '-Linux-32.tar.gz'
				},
				expand: true,
				cwd: 'build/releases/Teamwall/linux32/Teamwall',
				src: '**',
				dest: 'Teamwall'
			},
			linux64: {
				options: {
					mode: 'tgz',
					archive: 'build/releases/Teamwall/linux64/Teamwall-' + currentVersion + '-Linux-64.tar.gz'
				},
				expand: true,
				cwd: 'build/releases/Teamwall/linux64/Teamwall',
				src: '**',
				dest: 'Teamwall'
			},
			mac: {
				options: {
					mode: 'tgz',
					archive: 'build/releases/Teamwall/mac/Teamwall-' + currentVersion + '-Mac.tar.gz'
				},
				expand: true,
				cwd: 'build/releases/Teamwall/mac/',
				src: '**',
				dest: ''
			},
			windows: {
				options: {
					mode: 'zip',
					archive: 'build/releases/Teamwall/win/Teamwall-' + currentVersion + '-Win.zip'
				},
				expand: true,
				cwd: 'build/releases/Teamwall/win/Teamwall',
				src: '**',
				dest: 'Teamwall'
			}
		},

		clean: {
			releases: ['build/releases/Teamwall/**'],
			css: ['src/css/*.css'],
			dist: ['dist/*'],
			update: ['build/updater/*.*']
		}

	});
};
