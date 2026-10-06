import os
from PIL import Image, ImageFilter, ImageEnhance

def enhance_image(src_path, dest_path):
    with Image.open(src_path) as img:
        # Convert MPO or RGBA if needed
        original_mode = img.mode
        format_name = img.format or 'JPEG'
        
        # Don't upscale logo
        if 'logo' in os.path.basename(src_path).lower():
            return
            
        w, h = img.size
        print(f"Processing {os.path.basename(src_path)}: {w}x{h} ({img.format})")
        
        # Determine upscale factor
        scale = 1.0
        if h < 300:
            scale = 2.8 # 237px -> 663px
        elif h < 500:
            scale = 2.0 # 390px -> 780px
        elif h < 700 and w < 1200:
            scale = 1.5
            
        if scale > 1.0:
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Smart sharpening for upscaled image
            img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=130, threshold=2))
        else:
            # Subtle edge crisping for existing high-res
            if w <= 2000 and h <= 2000:
                img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=3))

        # Color and Contrast micro-enhancement for rich presentation punch
        if img.mode in ('RGB', 'RGBA'):
            # Convert to RGB if saving as JPEG
            if format_name in ('JPEG', 'MPO') and img.mode == 'RGBA':
                bg = Image.new('RGB', img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[3])
                img = bg
            
            enh_contrast = ImageEnhance.Contrast(img)
            img = enh_contrast.enhance(1.05)
            
            enh_color = ImageEnhance.Color(img)
            img = enh_color.enhance(1.08)
            
            enh_sharp = ImageEnhance.Sharpness(img)
            img = enh_sharp.enhance(1.10)

        # Save enhanced image
        if dest_path.lower().endswith('.png'):
            img.save(dest_path, format='PNG', optimize=True)
        elif dest_path.lower().endswith(('.jpg', '.jpeg', '.jfif')):
            img.convert('RGB').save(dest_path, format='JPEG', quality=95, optimize=True, subsampling=0)
            
        print(f" -> Enhanced {os.path.basename(dest_path)}: new size {img.size[0]}x{img.size[1]}")

def main():
    raw_dir = os.path.join('FOTOS', 'raw_originals')
    fotos_dir = 'FOTOS'
    
    for f in sorted(os.listdir(raw_dir)):
        src = os.path.join(raw_dir, f)
        dest = os.path.join(fotos_dir, f)
        if os.path.isfile(src) and not f.startswith('.'):
            try:
                enhance_image(src, dest)
            except Exception as e:
                print(f"Error processing {f}: {e}")

if __name__ == '__main__':
    main()
