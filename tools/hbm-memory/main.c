#include <stdio.h>
#include <stdlib.h>
#include <mruby.h>
#include <mruby/hash.h>
#include <mruby/hash_benchmark.h>

#define ALLOC_OFFSET 8

static size_t gTotalAllocSize;
static size_t gMaxAllocSize;

static size_t
mem_total_alloc_size(void)
{
  return gTotalAllocSize;
}

static size_t
mem_max_alloc_size(void)
{
  return gMaxAllocSize;
}

static void
mem_reset_alloc_size(void)
{
  gTotalAllocSize = gMaxAllocSize = 0;
}

static size_t
mem_alloc_size(void *ptr)
{
  return *(size_t*)(ptr - ALLOC_OFFSET);
}

static void*
mem_alloc(mrb_state *mrb, void *ptr, size_t size, void* ud)
{
  if (size == 0) {
    if (ptr) {
      gTotalAllocSize -= mem_alloc_size(ptr);
      free(ptr - ALLOC_OFFSET);
    }
    return NULL;
  }
  else {
    size_t old_size;
    void *new_ptr;
    if (ptr) {
      old_size = mem_alloc_size(ptr);
      new_ptr = realloc(ptr - ALLOC_OFFSET, size + ALLOC_OFFSET);
    }
    else {
      old_size = 0;
      new_ptr = malloc(size + ALLOC_OFFSET);
    }
    if (!new_ptr) return NULL;
    *(size_t*)new_ptr = size;
    gTotalAllocSize += size - old_size;
    if (gMaxAllocSize < gTotalAllocSize) gMaxAllocSize = gTotalAllocSize;
    return new_ptr + ALLOC_OFFSET;
  }
}

static void
print_alloc_size(mrb_int hash_size)
{
  printf("%"MRB_PRId"\t%zu\t%zu\n",
         hash_size, mem_total_alloc_size(), mem_max_alloc_size());
}

int
main(int argc, char **argv)
{
  mrb_int max_hash_size = DEFAULT_HASH_SIZE, hash_size = 0;
  mrb_value hash;
  mrb_state *mrb = NULL;

  if (!mrb_hbm_parse_arg(argc, argv, "[HASH-SIZE]", &max_hash_size)) goto final;
  if (!(mrb = mrb_hbm_open_mruby(mem_alloc))) goto final;
  mrb_hbm_disable_gc(mrb);
  mem_reset_alloc_size();
  puts("# hash size\ttotal alloc size\tmax alloc size");
  hash = mrb_hash_new(mrb);
  print_alloc_size(hash_size);
  for (hash_size = 1; hash_size <= max_hash_size; ++hash_size) {
    mrb_value v = mrb_fixnum_value(hash_size);
    mrb_hash_set(mrb, hash, v, v);
    print_alloc_size(hash_size);
  }

 final:
  return mrb_hbm_close_mruby(mrb);
}
