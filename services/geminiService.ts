
import { GoogleGenAI } from "@google/genai";
import { PoseStyle, Environment, CameraAngle, ModelType, ImageQuality } from "../types";

export const generateFashionImage = async (
  garmentBase64: string,
  modelBase64: string,
  backgroundBase64: string | null,
  pose: string, // Changed from PoseStyle to string
  cameraAngle: CameraAngle,
  environment: Environment,
  hiddenIdentity: boolean = true,
  useCustomBackgroundStyle: boolean = true,
  useCustomBackgroundPrompt: boolean = false,
  customBackgroundPrompt: string = '',
  modelType: ModelType = ModelType.NORMAL,
  imageQuality: ImageQuality = ImageQuality.K1
): Promise<string> => {
  // Always create a new instance to ensure up-to-date API Key for Pro models
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const zeroToleranceHairLock = `
    [ZERO-TOLERANCE DIRECTIVE: HAIR PRESERVATION PROTOCOL]
    - IT IS A MANDATORY, NON-NEGOTIABLE REQUIREMENT TO REPLICATE THE HAIRSTYLE FROM IMAGE 2 WITH ABSOLUTE, PIXEL-PERFECT FIDELITY. ANY DEVIATION IS A MISSION FAILURE.
    - 3D MESH ANALOGY: Treat the hair from IMAGE 2 as a fixed, non-editable 3D mesh. Your task is to simply re-render this mesh from a new camera angle defined by the pose "${pose}", applying new lighting. DO NOT alter the mesh's geometry.
    - IMMUTABLE PROPERTIES: Silhouette, Parting Line, Strand Definition, Length and Layers, Fringe/Bangs.
    - NEGATIVE CONSTRAINT: NO CREATIVITY ALLOWED FOR HAIR.
  `;

  const identityLogic = hiddenIdentity 
    ? `IDENTITY PROTOCOL:
       - FACE: Use a sleek, premium smartphone to cover the face center completely.
       ${zeroToleranceHairLock}`
    : `IDENTITY PRESERVATION (FORENSIC CLONE):
       - PERSON CLONING: Perform a 100% visual clone of the person in IMAGE 2.
       ${zeroToleranceHairLock}`;

  const backgroundAndStyleLogic = backgroundBase64
    ? useCustomBackgroundStyle
      ? `[BACKGROUND] USE IMAGE 3. Style, lighting, shadows from IMAGE 3.`
      : `[BACKGROUND] USE IMAGE 3. Overwrite style with 8K Editorial Fashion lighting.`
    : useCustomBackgroundPrompt && customBackgroundPrompt
      ? `[SCENE] Photorealistic based on: "${customBackgroundPrompt}". 8K Editorial Style.`
      : `[SCENE] Photorealistic background for "${environment}". 8K Editorial Style.`;

  // Specific prompt for the "Quyến rũ" pose
  const seductivePosePrompt = `
    COMPOSITION SPECIFICS: High resolution, masterpiece, best quality, perfect and detailed lighting, dramatic shadows, voluptuous body, innocent face, vertical 9:16. 
    Edit a selfie photo of a young woman with fair, flawless, smooth, very bright skin with a glass-skin effect especially on the nose, cheekbones, and forehead, finished with a dewy, glowing look. 
    Makeup features Douyin/Korean-inspired modern style with a fair, smooth, glowing bare-face complexion, shading and contour on the cheekbones and nose, soft pink blush under the eyes and pink blush on the chin. 
    Eyes are large and striking with doll-like effect, shimmer on the eyelids, neatly shaped thick natural black eyebrows, long curled false upper lashes, thin but visible lower lashes, prominent aegyosal, silver eyeliner under the lower lash line, winged eyeliner, bold sharp eye highlighter, contour above the lips, light blue clear contact lenses, and nude ombre lipstick with moist cherry-red inner lips and glossy finish. 
    Hair is extremely long, jet black, glossy, straight with layered butterfly cut, volume inward at the ends, falling to the side partially covering one eye, with remaining hair tucked behind the ear, slightly messy with strands falling on the forehead and cheeks as if blown by wind. 
    Pose is leaning against a wall in a feminine, seductive manner, head tilted up toward the camera with lips slightly parted. 
    The photo is taken at an extremely close angle, with the face filling almost the entire frame. Accessories include clearly visible earrings. 
    Style is a Chinese girl Instagram dump selfie, radiating natural beauty with ultra-realistic quality, not AI-generated. 
    Background is a dark or dimly lit room. Flash lighting from the side with soft, natural indoor illumination evenly highlighting the face, making the skin appear luminous and creating subtle shadows in the background. 
    Lighting effects include retro Japanese/Korean bluish-purple contrast filter emphasizing makeup details. 
    The photo is taken professionally with the latest iPhone camera, ultra-realistic, 16K resolution, editorial portrait, detailed skin, ultra-HD. 
    DO NOT CHANGE THE FACE AT ALL.
  `;

  const finalPoseConfig = pose === PoseStyle.QUYEN_RU 
    ? seductivePosePrompt 
    : `[COMPOSITION] POSE: "${pose}". CAMERA: "${cameraAngle}".`;

  const prompt = `
    ROLE: WORLD-CLASS FASHION PHOTOGRAPHER.
    MISSION: PRESERVE HAIR ARCHITECTURE WHILE CHANGING GARMENT.
    [CORE PRIORITY 1: ABSOLUTE HAIR LOCK] Source IMAGE 2.
    [CORE PRIORITY 2: GARMENT SYNTHESIS] Source IMAGE 1.
    ${finalPoseConfig}
    ${identityLogic}
    ${backgroundAndStyleLogic}
    [FINAL REQUIREMENT] Aspect Ratio: 9:16.
  `;

  try {
    const parts: any[] = [
      { inlineData: { data: garmentBase64.split(',')[1], mimeType: 'image/png' } },
      { inlineData: { data: modelBase64.split(',')[1], mimeType: 'image/png' } },
    ];

    if (backgroundBase64) {
      parts.push({ inlineData: { data: backgroundBase64.split(',')[1], mimeType: 'image/png' } });
    }

    parts.push({ text: prompt });

    const config: any = {
      imageConfig: {
        aspectRatio: "9:16"
      }
    };

    if (modelType === ModelType.PRO) {
      config.imageConfig.imageSize = imageQuality;
    }

    const response = await ai.models.generateContent({
      model: modelType,
      contents: { parts },
      config
    });

    if (!response.candidates?.[0]?.content?.parts) throw new Error("AI không phản hồi dữ liệu.");

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Không tìm thấy dữ liệu hình ảnh trong kết quả.");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const extractGarment = async (
  sourceImageBase64: string, 
  description?: string,
  modelType: ModelType = ModelType.NORMAL,
  imageQuality: ImageQuality = ImageQuality.K1
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    TASK: Professional Garment Extraction.
    DISPLAY: Clean studio background (#064e3b).
    FIDELITY: 100% accuracy.
    CONTEXT: ${description || "Extract the garment precisely."}
    Aspect Ratio: 9:16.
  `;

  try {
    const config: any = {
      imageConfig: {
        aspectRatio: "9:16"
      }
    };

    if (modelType === ModelType.PRO) {
      config.imageConfig.imageSize = imageQuality;
    }

    const response = await ai.models.generateContent({
      model: modelType,
      contents: {
        parts: [
          { inlineData: { data: sourceImageBase64.split(',')[1], mimeType: 'image/png' } },
          { text: prompt }
        ]
      },
      config
    });

    if (!response.candidates?.[0]?.content?.parts) throw new Error("Không nhận được kết quả.");
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Lỗi trích xuất trang phục.");
  } catch (error: any) {
    throw error;
  }
};
