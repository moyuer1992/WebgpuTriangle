const vertexShaderSource: string = `
  [[stage(vertex)]]
  fn main([[builtin(vertex_index)]] VertexIndex : u32)
       -> [[builtin(position)]] vec4<f32> {
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5));

    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
  }
`

const fragShaderSource: string = `
  [[stage(fragment)]]
  fn main() -> [[location(0)]] vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
  }
`

const init = async (canvas: HTMLCanvasElement) => {
  const adapter = await navigator.gpu.requestAdapter() as GPUAdapter
  const device = await adapter.requestDevice() as GPUDevice
  const context = canvas.getContext('webgpu') as GPUCanvasContext
  const devicePixelRatio = window.devicePixelRatio || 1
  const presentationFormat = context.getPreferredFormat(adapter) as GPUTextureFormat
  const presentationSize = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ]
  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize,
  })
  return {
    device,
    context,
    presentationFormat
  }
}

const createPipeline = (
  vertexShaderSource: string,
  fragShaderSource: string,
  device: GPUDevice,
  context: GPUCanvasContext,
  presentationFormat: GPUTextureFormat,
) => {
  return device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: vertexShaderSource,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: fragShaderSource,
      }),
      entryPoint: 'main',
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  })
}

async function main () {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const {
    device,
    context,
    presentationFormat,
  } = await init(canvas)
  const pipeline = createPipeline(
    vertexShaderSource,
    fragShaderSource,
    device as GPUDevice,
    context as GPUCanvasContext,
    presentationFormat as GPUTextureFormat
  )
  const frame = () => {
    const commandEncoder = device.createCommandEncoder()
    const textureView = context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          storeOp: 'store',
        },
      ],
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.draw(3, 1, 0, 0)
    passEncoder.endPass()

    device.queue.submit([commandEncoder.finish()])
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

main()
