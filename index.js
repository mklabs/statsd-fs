

// Sadly, statsd doest provide an API or entry point to require, so we
// rely on a spawned provess instead
//
// This is also where we ensure statsd is using our special backend to
// store the results back to file storage:  /tmp/metrics by default.

var events = require('events');
var spawn  = require('child_process').spawn;
var util   = require('util');
var debug  = require('debug')('statsd-fs');
var path   = require('path');

module.exports = StatsD;
StatsD.app = require('./app');
StatsD.FSBackend = require('./statsd-backend');
StatsD.Sets = require('./app/sets');

// Statsd entry point
StatsD.init = function init(startupTime, config, events) {
  var instance = new StatsD.FSBackend(startupTime, config, events);
  return true;
};

// An helper to spawn a statsd server for convenience (not part of the
// Backend API)
function StatsD(options) {
  options = options || {};

  this.options = options;
  this.path = options.path || require.resolve('statsd/stats');
  this.stdout = options.stdout || process.stdout;
  this.stderr = options.stderr || process.stderr;
  this.config = options.config || path.resolve(__dirname, 'statsd-config.js');
}

util.inherits(StatsD, events.EventEmitter);

StatsD.prototype.run = function run() {
  this.args = this.buildArgs();
  var p = this.process = spawn('node', this.args);

  p.stdout.pipe(this.stdout);
  p.stderr.pipe(this.stderr);

  p.on('exit', this.emit.bind(this, 'exit'));
  p.on('error', this.emit.bind(this, 'error'));
  p.on('close', this.emit.bind(this, 'close'));
  return this;
};

StatsD.prototype.buildArgs = function buildArgs() {
  var args = [this.path];
  args.push(this.config);
  return args;
};
