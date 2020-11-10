#include <stdio.h>
#include <stdlib.h>
#include <libgen.h>
#include <math.h>
#include <mruby.h>
#include <mruby/hash.h>
#include <mruby/hash_benchmark.h>

static int
each_func(mrb_state *mrb, mrb_value key, mrb_value val, void *data)
{
  return 0;
}

static void
measurement(mrb_state *mrb, mrb_int max_hash_size, int max_count, mrb_int *times)
{
  mrb_int hash_size, t;
  int ai = mrb_gc_arena_save(mrb), c;
  mrb_value hash = mrb_hash_new(mrb);
  struct RHash *h = mrb_hash_ptr(hash);
  for (hash_size = 0; hash_size <= max_hash_size; ++hash_size) {
    if (hash_size != 0) {
      mrb_value v = mrb_fixnum_value(hash_size);
      mrb_hash_set(mrb, hash, v, v);
    }
    t = mrb_hbm_time();
    for (c = 0; c < max_count; ++c) mrb_hash_foreach(mrb, h, each_func, NULL);
    times[hash_size] = mrb_hbm_time() - t;
  }
  mrb_gc_arena_restore(mrb, ai);
}

static int
estimate_count(mrb_state *mrb, mrb_int max_hash_size, mrb_int measurement_time)
{
  int estimation_count = 2500000/max_hash_size;
  mrb_int times[max_hash_size+1], total_time = 0, i;
  measurement(mrb, max_hash_size, estimation_count, times);
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
    int max_count;
    if (!(mrb = mrb_hbm_open_mruby(NULL))) goto final;
    mrb_hbm_disable_gc(mrb);
    max_count = estimate_count(mrb, max_hash_size, measurement_time);
    mrb_hbm_disable_gc(mrb);
    measurement(mrb, max_hash_size, max_count, times);
    printf("# %d times\n", max_count);
    puts("# hash size\ti/s\tseconds");
    for (hash_size = 0; hash_size <= max_hash_size; ++hash_size) {
      mrb_int t = times[hash_size];
      printf("%"MRB_PRId"\t"MRB_HBM_IPS_FMT"\t"MRB_HBM_ELAPSED_SEC_FMT"\n",
             hash_size, max_count*1e6/t, t/1e6);
    }
  }

 final:
  return mrb_hbm_close_mruby(mrb);
}
