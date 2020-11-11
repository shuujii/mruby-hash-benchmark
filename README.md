# Hash Benchmark for mruby

## Current report

[Current report](https://shuujii.github.io/mruby-hash-benchmark) is as of the time of [*Reduce memory usage of Hash object (#5121)*](https://github.com/mruby/mruby/pull/5121) pull request to mruby (the pull request has already been merged).

## How to execute benchmark

### Install

```console
$ git clone https://github.com/shuujii/mruby-hash-benchmark
```

### Download mruby and build benchmarker

```console
$ rake
```

### Execute benchmark

```console
$ rake benchmark
```

### Create benchmark report

```console
$ rake report
```

### View benchmark report

```console
$ rake server
```

And, open with browser [http://localhost:8080/mruby-hash-benchmark](http://localhost:8080/mruby-hash-benchmark)
