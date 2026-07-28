from PIL import Image

# Load the image
img = Image.open('website/public/logo.png')
img = img.convert("RGBA")

datas = img.getdata()

new_data = []
# Get the background color from the top-left pixel
bg_color = datas[0]

# Define a tolerance level for color matching
tolerance = 60

for item in datas:
    # Check if the pixel matches the background color within the tolerance
    if (abs(item[0] - bg_color[0]) < tolerance and 
        abs(item[1] - bg_color[1]) < tolerance and 
        abs(item[2] - bg_color[2]) < tolerance):
        # Change the pixel to transparent
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

# Update the image with the new data
img.putdata(new_data)

# Save the resulting image
img.save('website/public/logo.png', "PNG")
print("Background removed and saved successfully.")
