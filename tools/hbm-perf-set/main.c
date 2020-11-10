#include <stdio.h>
#include <stdlib.h>
#include <libgen.h>
#include <mruby.h>
#include <mruby/array.h>
#include <mruby/hash.h>
#include <mruby/hash_benchmark.h>

#define MIN_COUNT 2000

int
main(int argc, char **argv)
{
  mrb_int max_hash_size = DEFAULT_HASH_SIZE;
  mrb_int measurement_msec = DEFAULT_MEASUREMENT_MSEC;
  mrb_state *mrb = NULL;
  if (mrb_hbm_parse_arg(argc, argv, "[HASH-SIZE] [MEASUREMENT-MSEC]",
                        &max_hash_size, &measurement_msec)) {
    mrb_int measurement_time = measurement_msec * 1000;
    mrb_int times[max_hash_size], hash_size, elapsed_time = 0, total_time = 0;
    int i, c, total_count;
    mrb_value hash_ary, *hashes;
    if (!(mrb = mrb_hbm_open_mruby(NULL))) goto final;
    mrb_hbm_disable_gc(mrb);
    for (i = 0; i < max_hash_size; ++i) times[i] = 0;
    hash_ary = mrb_hbm_new_hashes(mrb, MIN_COUNT, 0);
    hashes = RARRAY_PTR(hash_ary);
    for (c = 1; elapsed_time < measurement_time; ++c) {
      for (i = 0; i < MIN_COUNT; ++i) mrb_hash_clear(mrb, hashes[i]);
      for (hash_size = 1; hash_size <= max_hash_size; ++hash_size) {
        mrb_value v = mrb_fixnum_value(hash_size);
        mrb_int t = mrb_hbm_time();
        for (i = 0; i < MIN_COUNT; ++i) mrb_hash_set(mrb, hashes[i], v, v);
        t = mrb_hbm_time() - t;
        times[hash_size-1] += t;
        elapsed_time += t;
      }
    }
    total_count = c * MIN_COUNT;
    printf("# %d times\n", total_count);
    puts("# hash size\teach i/s\teach seconds\ttotal i/s\ttotal seconds");
    for (hash_size = 1; hash_size <= max_hash_size; ++hash_size) {
      mrb_int t = times[hash_size-1];
      total_time += t;
      printf("%"MRB_PRId"\t"
             MRB_HBM_IPS_FMT"\t"
             MRB_HBM_ELAPSED_SEC_FMT"\t"
             MRB_HBM_IPS_FMT"\t"
             MRB_HBM_ELAPSED_SEC_FMT"\n",
             hash_size,
             total_count*1e6/t,
             t/1e6,
             total_count*1e6/total_time,
             total_time/1e6);
    }
  }

 final:
  return mrb_hbm_close_mruby(mrb);
}
