# frozen_string_literal: true

module MRuby::HashBenchmark
  class Report
    module ChartHelper
      darken = ->((h, s, l), amount){[h, s, l - amount]}
      hsl = ->((h, s, l)){"hsl(#{h},#{s}%,#{l}%)"}
      hsls_to_colors = ->(hsls, colors) do
        hsls.each do |k, v|
          case v
          when Array; colors[k] = hsl.(v)
          else hsls_to_colors.(v, colors[k] ||= {})
          end
        end
        colors
      end

      HSLS = {
        baseline: {figure: [28,90,61]},
        new: {figure: [213,90,61]},
        factors: {
          up: {stroke: [117,80,78],fill: [117,100,93],text: [117,48,41]},
          down: {stroke: [0,100,92],fill: [0,100,97],text: [0,73,60]},
        },
      }
      IMPLEMENTATIONS.each do |impl|
        impl = HSLS[impl]
        figure = impl[:figure]
        impl[:text] = darken.(figure, 12)
        impl[:expansions] = {el: figure, hb: darken.(figure, 30)}
      end
      COLORS = hsls_to_colors.(HSLS, {})
      COLORS[:axis] = "#282828"
      COLORS[:bg] = "#fff"

      LINE_CHART_WIDTH = 550
      LINE_CHART_HEIGHT = 270
      BAR_CHART_WIDTH = 600
      BAR_CHART_HEIGHT = 270

      UNITS = {"memory-usage" => "kB", "performance" => "M i/s"}
    end
  end
end
