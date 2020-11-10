#ifndef MRUBY_HASH_BENCHMARK_H
#define MRUBY_HASH_BENCHMARK_H

//#define MRB_HBM_DEBUG

#define DEFAULT_HASH_SIZE 500
#define DEFAULT_MEASUREMENT_MSEC 10000
#define MRB_HBM_IPS_FMT "%.17g"
#define MRB_HBM_ELAPSED_SEC_FMT "%.17g"

#ifdef MRB_HBM_DEBUG
# define DPRINTF(...) fprintf(stderr, __VA_ARGS__)
#else
# define DPRINTF(...) (void)0
#endif

mrb_state* mrb_hbm_open_mruby(mrb_allocf alloc_func);
int mrb_hbm_close_mruby(mrb_state *mrb);
mrb_bool mrb_hbm_parse_arg(int argc, char **argv, const char *spec, ...);
mrb_int mrb_hbm_time(void);
mrb_value mrb_hbm_new_hashes(mrb_state *mrb, mrb_int n_hash, mrb_int hash_size);

static inline void
mrb_hbm_disable_gc(mrb_state *mrb)
{
  mrb->gc.disabled = FALSE;
  mrb_full_gc(mrb);
  mrb->gc.disabled = TRUE;
}

#endif  /* MRUBY_HASH_BENCHMARK_H */
