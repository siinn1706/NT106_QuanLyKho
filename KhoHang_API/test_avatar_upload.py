"""Test avatar upload with WebP conversion"""
import requests
from pathlib import Path

# API configuration
BASE_URL = "http://localhost:8000"
TOKEN = "YOUR_TOKEN_HERE"  # Replace with actual token

def test_avatar_upload():
    """Test uploading an avatar image"""
    
    # Use a test image (you can replace with any image path)
    # For this test, we'll use the existing avatar if it exists
    test_images = [
        Path("uploads/avatars/e297a73d-4f5a-4867-9c56-d21d88d0c1e3.jpg"),
        Path("C:/Users/Siinn/Pictures"),  # Or any test image
    ]
    
    test_image = None
    for img_path in test_images:
        if img_path.exists():
            if img_path.is_dir():
                # Get first image from directory
                for ext in ['*.jpg', '*.jpeg', '*.png']:
                    images = list(img_path.glob(ext))
                    if images:
                        test_image = images[0]
                        break
            else:
                test_image = img_path
                break
    
    if not test_image or not test_image.exists():
        print("❌ No test image found")
        return
    
    print(f"📸 Using test image: {test_image}")
    print(f"📦 Original size: {test_image.stat().st_size / 1024:.2f} KB")
    
    # Upload avatar
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    
    with open(test_image, "rb") as f:
        files = {"file": (test_image.name, f, "image/jpeg")}
        response = requests.post(
            f"{BASE_URL}/users/me/avatar",
            files=files,
            headers=headers
        )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Upload successful!")
        print(f"🔗 Avatar URL: {data['avatar_url']}")
        
        # Check the saved file
        avatar_filename = data['avatar_url'].split('/')[-1]
        from app.database import get_datadir
        data_dir = get_datadir()
        saved_file = data_dir / "uploads" / "avatars" / avatar_filename
        
        if saved_file.exists():
            print(f"💾 Saved as: {saved_file}")
            print(f"📦 WebP size: {saved_file.stat().st_size / 1024:.2f} KB")
            print(f"🎉 Compression ratio: {(1 - saved_file.stat().st_size / test_image.stat().st_size) * 100:.1f}% smaller")
        else:
            print(f"⚠️  Saved file not found at: {saved_file}")
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"📝 Response: {response.text}")

if __name__ == "__main__":
    print("🧪 Testing Avatar Upload with WebP Conversion\n")
    test_avatar_upload()
