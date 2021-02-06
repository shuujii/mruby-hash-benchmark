#include <stdlib.h>
#include <stdint.h>
#include <stdarg.h>
#include <string.h>
#include <time.h>
#include <libgen.h>
#include <mruby.h>
#include <mruby/array.h>
#include <mruby/hash.h>
#include <mruby/hash_benchmark.h>

static uint64_t gBaseTime;

static uint64_t
time_get_absolute(void)
{
  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);
  return ts.tv_sec * 1000000 + ts.tv_nsec / 1000;
}

static mrb_value
hbm_s_time(mrb_state *mrb, mrb_value klass)
{
  return mrb_fixnum_value(mrb_hbm_time());
}

static mrb_value
hbm_s_disable_gc(mrb_state *mrb, mrb_value klass)
{
  mrb_hbm_disable_gc(mrb);
  return mrb_nil_value();
}

static mrb_value
hbm_s_new_hashes(mrb_state *mrb, mrb_value klass)
{
  mrb_int n_hash, hash_size;
  mrb_get_args(mrb, "ii", &n_hash, &hash_size);
  return mrb_hbm_new_hashes(mrb, n_hash, hash_size);
}

#ifdef MRB_HBM_DEBUG
static mrb_value
hbm_s_print_heap_page_info(mrb_state *mrb, mrb_value klass)
{
  typedef struct {void *data[6];} rvalue;
  mrb_heap_page* page = mrb->gc.heaps;
  int page_no = 1;
  const char *sep = " ";
  DPRINTF("pase size: %d\n", MRB_HEAP_PAGE_SIZE);
  DPRINTF("     live:");
  for (; page; page = page->next, ++page_no, sep = ", ") {
    rvalue *obj = (rvalue*)(page->objects);
    int live = 0, i = 0;
    for (; i < MRB_HEAP_PAGE_SIZE; ++i, ++obj) {
      if (!mrb_object_dead_p(mrb, (struct RBasic*)obj)) ++live;
    }
    DPRINTF("%spage%d=%d", sep, page_no, live);
  }
  DPRINTF("\n");
  return mrb_nil_value();
}
#endif

mrb_state*
mrb_hbm_open_mruby(mrb_allocf alloc_func)
{
  mrb_state *mrb = mrb_open_allocf(alloc_func, NULL);
  if (!mrb) fputs("mrb_open_allocf() failure\n", stderr);
  return mrb;
}

int
mrb_hbm_close_mruby(mrb_state *mrb)
{
  if (mrb) {
    mrb_close(mrb);
    return EXIT_SUCCESS;
  }
  else {
    return EXIT_FAILURE;
  }
}

/* return microseconds */
mrb_int
mrb_hbm_time(void)
{
  return (mrb_int)(time_get_absolute() - gBaseTime);
}

mrb_bool
mrb_hbm_parse_arg(int argc, char **argv, const char *spec, ...)
{
  int max_argc, i;
  const char *p;
  va_list ap;
  for (p = spec, max_argc = 2; (p = strchr(p, ' ')); ++p, ++max_argc);
  if (max_argc < argc) goto failure;
  va_start(ap, spec);
  for (i = 1; i < argc; ++i) {
    char *endp;
    mrb_int v = (mrb_int)strtol(argv[i], &endp, 10);
    if (*endp != 0 && v <= 0) goto failure;
    *(va_arg(ap, mrb_int*)) = v;
  }
  va_end(ap);
  return TRUE;

 failure:
  fprintf(stderr, "Usage: %s %s\n", basename(argv[0]), spec);
  return FALSE;
}

mrb_value
mrb_hbm_new_hashes(mrb_state *mrb, mrb_int n_hash, mrb_int hash_size)
{
  mrb_value hash_ary = mrb_ary_new_capa(mrb, n_hash);
  mrb_value *hashes = RARRAY_PTR(hash_ary);
  mrb_int i, j;
  mrb_ary_set(mrb, hash_ary, n_hash-1, mrb_nil_value());
  for (i = 0; i < n_hash; ++i) {
    int ai = mrb_gc_arena_save(mrb);
    hashes[i] = mrb_hash_new(mrb);
    for (j = 1; j <= hash_size; ++j) {
      mrb_value v = mrb_fixnum_value(j);
      mrb_hash_set(mrb, hashes[i], v, v);
    }
    mrb_gc_arena_restore(mrb, ai);
  }
  ARY_SET_LEN(mrb_ary_ptr(hash_ary), n_hash);
  return hash_ary;
}

void
mrb_mruby_hash_benchmark_gem_init(mrb_state* mrb)
{
  struct RClass *c = mrb_define_module(mrb, "HashBenchmark");
  mrb_define_class_method(mrb, c, "time", hbm_s_time, MRB_ARGS_NONE());
  mrb_define_class_method(mrb, c, "disable_gc", hbm_s_disable_gc, MRB_ARGS_NONE());
  mrb_define_class_method(mrb, c, "new_hashes", hbm_s_new_hashes, MRB_ARGS_REQ(2));
#ifdef MRB_HBM_DEBUG
  mrb_define_class_method(mrb, c, "print_heap_page_info", hbm_s_print_heap_page_info, MRB_ARGS_NONE());
#endif
  gBaseTime = time_get_absolute();
}

void
mrb_mruby_hash_benchmark_gem_final(mrb_state* mrb)
{
}
