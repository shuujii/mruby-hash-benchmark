#include <stdio.h>
#include <stdlib.h>
#include <libgen.h>
#include <math.h>
#include <mruby.h>
#include <mruby/hash.h>
#include <mruby/hash_benchmark.h>

static void
measurement(mrb_state *mrb, mrb_int max_hash_size, int max_count,
            int *counts, mrb_int *times)
{
  mrb_int hash_size, i, t;
  int ai = mrb_gc_arena_save(mrb), loop_count, c;
  mrb_value hash = mrb_hash_new(mrb);
  for (hash_size = 0; hash_size <= max_hash_size; ++hash_size) {
    if (hash_size != 0) {
      mrb_value v = mrb_fixnum_value(hash_size);
      mrb_hash_set(mrb, hash, v, v);
    }
    loop_count = max_count/(hash_size+1);
    t = mrb_hbm_time();
    for (c = 0; c < loop_count; ++c) {
      for (i = 0; i <= hash_size; ++i) {
        mrb_hash_get(mrb, hash, mrb_fixnum_value(i));
      }
    }
    times[hash_size] = mrb_hbm_time() - t;
    counts[hash_size] = loop_count*(hash_size+1);
  }
  mrb_gc_arena_restore(mrb, ai);
}

static int
estimate_count(mrb_state *mrb, mrb_int max_hash_size, mrb_int measurement_time)
{
  int estimation_count = 2500000/max_hash_size;
  int counts[max_hash_size+1];
  mrb_int times[max_hash_size+1], total_time = 0, i;
  measurement(mrb, max_hash_size, estimation_count, counts, times);
  for (i = 0; i <= max_hash_size; ++i) total_time += times[i];
  DPRINTF("estimate time: %"MRB_PRId"\n", total_time);
  return (int)ceil((double)estimation_count / total_time * measurement_time);
}

int
main(int argc, char **argv)
{
  mrb_int max_hash_size = DEFAULT_HASH_SIZE;
  mrb_int measurement_msec = DEFAULT_MEASUREMENT_MSEC;
  mrb_state *mrb = NULL;
  if (mrb_hbm_parse_arg(argc, argv, "[HASH-SIZE] [MEASUREMENT-MSEC]",
                         &max_hash_size, &measurement_msec)) {
    mrb_int measurement_time = measurement_msec * 1000;
    mrb_int hash_size, times[max_hash_size+1];
    int counts[max_hash_size+1];
    int max_count;  /* max iteration per hash size */
    if (!(mrb = mrb_hbm_open_mruby(NULL))) goto final;
    mrb_hbm_disable_gc(mrb);
    max_count = estimate_count(mrb, max_hash_size, measurement_time);
    DPRINTF("max_count: %d\n", max_count);
    mrb_hbm_disable_gc(mrb);
    measurement(mrb, max_hash_size, max_count, counts, times);
    puts("# hash size\ti/s\titerations\tseconds");
    for (hash_size = 0; hash_size <= max_hash_size; ++hash_size) {
      mrb_int t = times[hash_size];
      int c = counts[hash_size];
      printf("%"MRB_PRId"\t"MRB_HBM_IPS_FMT"\t%d\t"MRB_HBM_ELAPSED_SEC_FMT"\n",
             hash_size, c*1e6/t, c, t/1e6);
    }
  }

 final:
  return mrb_hbm_close_mruby(mrb);
}
