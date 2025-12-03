#!/bin/bash
# Simple script to create placeholder icons using ImageMagick
# If ImageMagick is not installed, use the generate-icons.html file instead

SIZES=(72 96 128 144 152 192 384 512)
COLOR="#4F46E5"

for size in "${SIZES[@]}"; do
    # Create a simple colored square with text
    convert -size ${size}x${size} xc:"${COLOR}" \
        -gravity center \
        -pointsize $((size / 3)) \
        -fill white \
        -annotate +0-$((size / 10)) "O" \
        -pointsize $((size / 6)) \
        -annotate +0+$((size / 5)) "出社" \
        "icon-${size}.png"
    
    echo "Created icon-${size}.png"
done

echo "All icons created!"
echo "Note: If ImageMagick is not installed, open generate-icons.html in a browser instead."
