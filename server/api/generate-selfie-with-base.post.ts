import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const apiKey = config.geminiApiKey

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'GEMINI_API_KEY is not configured'
      })
    }

    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No image files provided'
      })
    }

    // Find the base image and user image in form data
    const baseImageFile = formData.find(item => item.name === 'baseImage' && item.filename)
    const userImageFile = formData.find(item => item.name === 'image' && item.filename)
    
    if (!baseImageFile || !baseImageFile.data) {
      throw createError({
        statusCode: 400,
        message: 'Base image file is required'
      })
    }

    if (!userImageFile || !userImageFile.data) {
      throw createError({
        statusCode: 400,
        message: 'User image file is required'
      })
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    if (baseImageFile.type && !allowedTypes.includes(baseImageFile.type)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid base image file type. Please upload a JPEG, PNG, or WebP image.'
      })
    }

    if (userImageFile.type && !allowedTypes.includes(userImageFile.type)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid user image file type. Please upload a JPEG, PNG, or WebP image.'
      })
    }

    // Convert uploaded images to Uint8Array (no disk I/O)
    const baseImageUint8Array = new Uint8Array(baseImageFile.data)
    const userImageUint8Array = new Uint8Array(userImageFile.data)

    // Use AI SDK with generateText for Gemini 2.5 Flash Image (Nano Banana)
    // This model supports image editing/generation with input images
    const googleProvider = createGoogleGenerativeAI({ apiKey: apiKey })
    
    // Determine media types for both images
    const baseImageMediaType = baseImageFile.type || 'image/jpeg'
    const userImageMediaType = userImageFile.type || 'image/jpeg'
    
    const result = await generateText({
      model: googleProvider('gemini-2.5-flash-image'),
      prompt: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'CRITICAL IDENTITY PRESERVATION REQUIREMENT: You must preserve the EXACT facial appearance and identity of the person shown in the user selfie image. The person in the final image must look IDENTICAL to the person in the user selfie - same face shape, same eye color and shape, same nose, same mouth, same skin tone, same hair color and style, same distinctive features. Do not alter, modify, or stylize the person\'s appearance. The person must be recognizable as the exact same individual from the selfie image.'
            },
            {
              type: 'text',
              text: '[BASE Background Image]'
            },
            {
              type: 'image',
              image: baseImageUint8Array,
              mediaType: baseImageMediaType
            },
            {
              type: 'text',
              text: '[User Selfie Image - PRESERVE THIS PERSON\'S EXACT APPEARANCE]'
            },
            {
              type: 'image',
              image: userImageUint8Array,
              mediaType: userImageMediaType
            },
            {
              type: 'text',
              text: 'COMPOSITION TASK: Generate a single, hyper-realistic, high-detail selfie photograph. Use the BASE background image as the complete environment and setting for the final image. Integrate the person from the user selfie image into this background, placing them naturally in the scene. The person must maintain their EXACT facial features, skin tone, hair, eye color, and all distinctive characteristics from the selfie image - they must be instantly recognizable as the same person.'
            },
            {
              type: 'text',
              text: 'The final image should have a selfie-style perspective (close-up, intimate framing) as if taken from a first-person viewpoint. The person should be smiling and looking directly into the camera lens. DO NOT include any visible hands, smartphones, phones, or camera equipment in the frame - only show the person and the background. Maintain consistent, warm, soft, natural daylight lighting that matches the base image environment. The final image must appear as a spontaneous, single-shot photograph taken in the original environment of the BASE background image.'
            },
            {
              type: 'text',
              text: 'REMINDER: The person\'s identity, facial features, and appearance from the user selfie image must be preserved EXACTLY - do not create a generic or stylized version. The person must look like themselves, not a different person.'
            }
          ]
        }
      ]
    })

    // Extract the generated image from result.files
    const generatedImageFile = result.files?.find(file => file.mediaType?.startsWith('image/'))
    
    if (!generatedImageFile) {
      console.error('=== Error: No image file found ===')
      console.error('Available files:', result.files)
      console.error('Result text content:', result.text)
      throw new Error('No image was generated in the response')
    }

    // Convert Uint8Array to base64 data URL for the frontend
    const base64String = Buffer.from(generatedImageFile.uint8Array).toString('base64')
    const dataUrl = `data:${generatedImageFile.mediaType};base64,${base64String}`
    
    return {
      success: true,
      image: dataUrl
    }
  } catch (error: any) {
    console.error('Error generating selfie:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate selfie'
    })
  }
})
