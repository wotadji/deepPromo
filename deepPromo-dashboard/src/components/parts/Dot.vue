<template>
  <div 
    class="dot"
    :class="dotClass"
    :title="label + ': ' + formatted"
  >
    {{ label }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: Number
})

const formatted = computed(() => {
  if (!props.value) return '0'
  return (props.value >= 1e6)
    ? (props.value/1e6).toFixed(1)+'M'
    : (props.value/1e3).toFixed(1)+'k'
})

const dotClass = computed(() => {
  if (props.value > 0) return 'dot-pos'
  if (props.value < 0) return 'dot-neg'
  return 'dot-neutral'
})
</script>

<style scoped>
.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.dot-pos { background: #6A9C47; }
.dot-neg { background: #C0504D; }
.dot-neutral { background: #999; }
</style>
