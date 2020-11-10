# frozen_string_literal: true

autoload :JSON, 'json'
require_relative 'base'
require_relative 'chart_helper'

module MRuby::HashBenchmark
  class Report
    class Chart < Base
      include ChartHelper

      def run
        write_js
        BaseChart.classes.each {|c| c.new.run}
      end

    private

      def write_js
        erb_path = "#{report_root}/js/chart.js.erb"
        js_path = "#{doc_root}/js/chart.js"
        expansion_path = data_dir("memory-usage/expansion.json")
        helper_path = "#{__dir__}/chart_helper.rb"
        task js_path => [erb_path, expansion_path, helper_path, __FILE__] do
          locals = {expansions: File.read(expansion_path)}
          js = erb(erb_path, tag: :js, locals: locals)
          write_file(js_path, capture("uglifyjs", stdin_data: js))
        end
      end

      module PerformanceChart
        def expansion?; self.class == Performance::CSet end
      end

      module LineChart
        def style; :line end
      end

      module BarChart
        def style; :bar end
      end

      class BaseChart
        include Util

        class << self
          def inherited(sub) classes << sub end
          def classes; @@classes ||= [] end
          def category; @category ||= hyphenize(name.split("::")[4]).freeze end
          def feature; @feature ||= hyphenize(name.split("::")[5]).freeze end
          def key; @key ||= [category, feature].compact.join("-").freeze end
        private
          def hyphenize(str) str.gsub(/.\K[A-Z]/, '-\&').downcase if str end
        end

        def run
          BUILD_MODES.each{|mode| write_json(mode)}
          write_html
        end

        def legend_html(b)
          b.div(".legend") do
            b.div(".legend-header"){"Hash Size: --"} if style == :line
            b.div(".legend-body") do
              b.div(".legend-items") do
                legend_item_html(b, "baseline", "Baseline", unit)
                legend_item_html(b, "new", "New", unit)
                legend_item_html(b, "factor", "Factor", "times")
              end

              next if style == :bar
              b.div(".legend-items") do
                legend_item_html(b, "expansion-el", "Entry List Expansion")
                legend_item_html(b, "expansion-hb", "Hash Buckets Expansion")
              end if expansion?
              b.div(".legend-notes") do
                b.div{"Drag and drop to zoom in (double-click resets)"}
              end
            end
          end
        end

        #
        #   div(".legend-item.baseline")
        #     div(".legend-figure")
        #     div(".legend-label"){"Baseline:"}
        #     div(".legend-value"){"--"}
        #     div(".legend-unit"){"kB"}
        #     div(".legend-expansions")
        #       div(".el")
        #       div(".hb")
        #
        def legend_item_html(b, key, label, unit=nil)
          has_value = style == :line && unit
          b.div(".legend-item.#{key}") do
            b.div(".legend-figure") do
              next unless key == "factor"
              color_type = style == :line ? "area" : "text"
              up_down_keys = %w[up down]
              up_down_keys.reverse! if category == "memory-usage"
              up_down_keys.each{|up_down| b.div(".#{color_type}.#{up_down}")}
            end
            b.div(".legend-label"){label + (has_value ? ":" : "")}

            next unless has_value
            b.div(".legend-value"){"--"}
            b.div(".legend-unit"){unit}
            b.div(".legend-expansions") do
              b.div(".el.off")
              b.div(".hb.off")
            end if key != "factor" && expansion?
          end
        end

        def unit; Chart::UNITS[category] end

        module_eval %w[category feature key].map {|name|
          "def #{name}; self.class.#{name} end"
        } * "\n"

      private

        def write_json(mode)
          baseline_tsv_path = tsv_path(:baseline, mode)
          new_tsv_path = tsv_path(:new, mode)
          json_path = json_path(mode)
          task json_path => [baseline_tsv_path, new_tsv_path] do
            next unless (hash_sizes, baseline = read_tsv(baseline_tsv_path))
            next unless (hash_sizes, new = read_tsv(new_tsv_path))
            write_file(json_path, JSON.generate([hash_sizes, baseline, new]))
          end
        end

        def read_tsv(path)
          return unless File.exist?(path)
          hash_sizes, ipses = [], []
          Tsv.each(path) do |hash_size, value, *|
            hash_sizes << hash_size.to_i
            ipses << value.to_f
          end
          [hash_sizes, ipses]
        end

        def write_html
          path = html_path
          task path => __FILE__ do
            html = build_html(self) do |c|
              #
              # div("#chart-performance-c-get.line-chart")
              #   div(".modes")
              #     div(".mode")
              #     ...
              #   div(".chart-item")
              #     div(".chart")
              #     div(".legent")
              #       ...
              #   ...
              #
              div("#chart-#{c.key}.#{c.style}-chart") do
                div(".modes") do
                  BUILD_MODES.each do |mode|
                    div(".mode", "data-mode": mode){c.build_mode_text(mode)}
                  end
                end
                (c.feature == "c-set" ? 2 : 1).times do
                  div(".chart-item") do
                    div(".chart")
                    c.legend_html(self)
                  end
                end
              end
            end << "\n"
            write_file(path, html)
          end
        end

        def json_path(mode)
          path_join(doc_root, category, feature, "#{mode}.json")
        end

        def tsv_path(impl, mode)
          path_join(data_root, category, feature, impl, "#{mode}.tsv")
        end

        def html_path
          path_join(data_root, category, feature, "chart.html")
        end
      end

      class MemoryUsage < BaseChart
        include LineChart
        def expansion?; true end
      end

      module Performance
        FEATURES = begin
          content = File.read("#{Util.page_root}/04-performance.md.erb")
          content.scan(%r@["']\K[^"']+?(?=/chart\.html["'])@)
        end #'
        C_FEATURES, RUBY_FEATURES = FEATURES.partition{|f| f.start_with?("c-")}

        FEATURES.each do |feature|
          name = feature.gsub(/(?:^|-)(.)/){$1.upcase}
          const_set name, Class.new(BaseChart) {
            include PerformanceChart
            include feature.start_with?("c-") ? LineChart : BarChart
          }
        end
      end
    end
  end
end
