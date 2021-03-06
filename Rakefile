require_relative 'lib/mruby/hash_benchmark/util'
require_relative 'lib/mruby/hash_benchmark/report/chart'

Util = MRuby::HashBenchmark::Util
BUILD_MODES = MRuby::HashBenchmark::BUILD_MODES
IMPLEMENTATIONS = MRuby::HashBenchmark::IMPLEMENTATIONS
FEATURES = MRuby::HashBenchmark::Report::Chart::Performance::FEATURES

Rake.verbose(false) if Rake.verbose == Rake::DSL::DEFAULT

def util(*args, &block)
  Util.instance_exec(*args, &block)
end

def header_log(*labels)
  header = "== #{labels * ' > '} "
  puts "#{header}#{'=' * (80 - header.size)}"
end

def build_modes
  @build_modes ||= ENV['BUILD_MODE']&.split(",") || BUILD_MODES
end

def each_mode_and_impl(&block)
  build_modes.each{|mode| IMPLEMENTATIONS.each{|impl| block.(mode, impl)}}
end

def run_c_cmd(cmdline, out_root, impl, mode, log: true)
  cmd, arg = cmdline.split(/[ \t]+/, 2)
  bin_path = "#{Util.build_dir(impl, mode)}/bin/#{cmd}"
  tsv_path = "#{out_root}/#{impl}/#{mode}.tsv"
  if File.exist?(bin_path)
    out = Util.capture("#{bin_path} #{arg}")
    util{write_file(tsv_path, out)} if log
  else
    util{log(:skip, from_root(tsv_path))} if log
  end
end

task :default => %i[download build]

desc "Download mruby"
task :download do
  header_log "Download"
  IMPLEMENTATIONS.each{|impl| sh "bin/hbm-download -i #{impl}"}
end

desc "Build benchemarker"
task :build, :opts do |t, opts: nil|
  each_mode_and_impl do |mode, impl|
    header_log "Build", mode, impl
    sh "bin/hbm-build -m #{mode} -i #{impl} #{opts}"
  end
end

desc "Execute benchmark"
task :benchmark => %w[memory-usage performance bin-size].map{|t| "benchmark:#{t}"}

namespace :benchmark do
  desc "Execute memory usage benchmark"
  task "memory-usage" do
    header_log "Benchmark", "Memory Usage"
    sh "bin/hbm-expansion"
    out_root = Util.data_dir("memory-usage")
    each_mode_and_impl do |mode, impl|
      run_c_cmd "hbm-memory", out_root, impl, mode
    end
  end

  desc "Execute performance benchmark"
  task :performance => FEATURES.map{|t| "benchmark:performance:#{t}"}

  namespace :performance do
    FEATURES.each do |feature|
      desc "Execute performance #{feature} benchmark"
      task feature do
        l, f = feature.split("-")
        header_log *%W[Benchmark Performance #{feature}]
        out_root = Util.data_dir("performance", feature)
        each_mode_and_impl do |mode, impl|
          if l == "c"
            cmd = "hbm-perf-#{feature.sub(/^c-/, '')}"
            run_c_cmd cmd, out_root, impl, mode, log: false  # warm up
            run_c_cmd cmd, out_root, impl, mode
          else
            cmdline = "bin/hbm-perf-ruby -i #{impl} -m #{mode} -f #{f}"
            Util.capture(cmdline)  # warm up
            sh cmdline
          end
        end
      end
    end
  end

  desc "Execute binary size benchmark"
  task "bin-size" do
    out_root = Util.data_dir("bin-size")
    each_mode_and_impl do |mode, impl|
      sh "bin/hbm-bin-size -i #{impl} -m #{mode}"
    end
  end
end

desc "Collect environmental information"
task :env do
  header_log "Environment"
  sh "bin/hbm-code"
  sh "bin/hbm-impl"
  sh "bin/hbm-platform"
  sh "bin/hbm-compiler"
  out_root = Util.env_dir("type-size")
  each_mode_and_impl do |mode, impl|
    run_c_cmd "hbm-type-size", out_root, impl, mode
  end
end

desc "Create benchmark report"
task :report => :env do
  sh "bin/hbm-report"
end

desc "Start HTTP server for viewing report"
task :server do
  puts "Open with browser http://localhost:8080/mruby-hash-benchmark after launch"
  puts
  exec *%W[#{FileUtils::RUBY} -run -e httpd #{__dir__}]
end
