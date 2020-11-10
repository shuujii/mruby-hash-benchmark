MRuby::Gem::Specification.new("mruby-hash-benchmark") do |spec|
  spec.license = "MIT"
  spec.author  = "KOBAYASHI Shuji"
  spec.summary = "Hash benchmark"
  spec.bins    = Dir.children("#{__dir__}/tools")
end
