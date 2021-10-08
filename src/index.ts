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
interface WebGPUInfo {
  adapter: GPUAdapter
  device: GPUDevice
  context: GPUCanvasContext
}

const getPresentationFormat = (context: GPUCanvasContext, adapter: GPUAdapter): GPUTextureFormat => {
  return context.getPreferredFormat(adapter) as GPUTextureFormat
}

const getPresentationSize = (canvas: HTMLCanvasElement, devicePixelRatio: number): [number, number] => {
  return [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ]
}

const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1
}

const getWebGPUInfo = async (canvas: HTMLCanvasElement): Promise<WebGPUInfo> => {
  const adapter: GPUAdapter = await navigator.gpu.requestAdapter()
  const device: GPUDevice = await adapter.requestDevice()
  const context: GPUCanvasContext = canvas.getContext('webgpu')
  return {
    adapter,
    device,
    context,
  }
}

const init = async (canvas: HTMLCanvasElement): Promise<WebGPUInfo> => {
  const {
    adapter,
    device,
    context,
  } = await getWebGPUInfo(canvas)
  const devicePixelRatio: number = getDevicePixelRatio()
  const presentationFormat: GPUTextureFormat = getPresentationFormat(context, adapter)
  const presentationSize: Array<number> = getPresentationSize(canvas, devicePixelRatio)
  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize,
  })
  return {
    adapter,
    device,
    context,
  }
}

const createPipeline = (
  vertexShaderSource: string,
  fragShaderSource: string,
  webGpuInfo: WebGPUInfo,
) => {
  const {
    adapter,
    device,
    context,
  } = webGpuInfo
  const presentationFormat = getPresentationFormat(context, adapter) as GPUTextureFormat
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

const drawFrame = (pipeline: GPURenderPipeline, webGpuInfo: WebGPUInfo): void => {
  const {
    device,
    context,
  } = webGpuInfo
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
}

async function main () {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const webGpuInfo = await init(canvas)
  const pipeline = createPipeline(
    vertexShaderSource,
    fragShaderSource,
    webGpuInfo,
  )
  const {
    device,
    context,
  } = webGpuInfo
  const frame = () => {
    drawFrame(pipeline, webGpuInfo)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

main()
