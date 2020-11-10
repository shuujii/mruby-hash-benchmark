# frozen_string_literal: true

module MRuby::HashBenchmark
  autoload :Markdown, 'mruby/hash_benchmark/markdown'
  autoload :Tsv, 'mruby/hash_benchmark/tsv'

  class Report
    class Base
      include Util
    end
  end
end
