import os
from flask import Flask, render_template, redirect, request, url_for, flash
from werkzeug.utils import secure_filename
import sys
sys.path.insert(0, "db/")
from db.dbhelper import addrecord, deleterecord, updaterecord, getall, getrecord

app = Flask(__name__)
app.secret_key = "dev"

# upload config
UPLOAD_FOLDER = os.path.join(app.root_path, "static", "images")
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def save_image(file_storage, idno: str) -> str | None:
    if not file_storage or file_storage.filename == "":
        return None
    if not allowed_file(file_storage.filename):
        return None
    filename = secure_filename(f"{idno}_{file_storage.filename}")
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file_storage.save(path)
    return filename

def remove_image(filename: str) -> None:
    if not filename:
        return
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print("Failed to remove image:", e)

# --- Routes ---

@app.route("/")
def index():
    students = getall("students")
    return render_template("index.html", studentlist=students)

@app.route("/add", methods=["POST"])
def add_student():
    idno = request.form.get("idno", "").strip()
    lastname = request.form.get("lastname", "").strip()
    firstname = request.form.get("firstname", "").strip()
    course = request.form.get("course", "").strip()
    level = request.form.get("level", "").strip()

    if not idno or not lastname or not firstname:
        flash("ID, Lastname and Firstname required", "error")
        return redirect(url_for("index"))

    image_file = request.files.get("image")
    fname = save_image(image_file, idno) if image_file else None

    addrecord(
        "students",
        idno=idno,
        lastname=lastname,
        firstname=firstname,
        course=course,
        level=level,
        image=fname or ""
    )
    flash("Student added", "success")
    return redirect(url_for("index"))

@app.route("/update/<idno>", methods=["POST"])
def update_student(idno):
    new_idno = request.form.get("idno", "").strip()
    lastname = request.form.get("lastname", "").strip()
    firstname = request.form.get("firstname", "").strip()
    course = request.form.get("course", "").strip()
    level = request.form.get("level", "").strip()

    # get existing record
    existing = getrecord("students", idno=idno)
    old_image = existing[0]["image"] if existing and "image" in existing[0] else ""

    # handle image upload
    image_file = request.files.get("image")
    if image_file and image_file.filename:
        saved = save_image(image_file, new_idno or idno)
        if old_image and old_image != saved:
            remove_image(old_image)
        final_image = saved
    else:
        # keep old image, optionally rename if ID changed
        if old_image and new_idno and new_idno != idno:
            ext = old_image.rsplit(".", 1)[1]
            new_image_name = secure_filename(f"{new_idno}_{existing[0]['idno']}.{ext}")
            os.rename(
                os.path.join(app.config["UPLOAD_FOLDER"], old_image),
                os.path.join(app.config["UPLOAD_FOLDER"], new_image_name)
            )
            final_image = new_image_name
        else:
            final_image = old_image

    update_data = {
        "lastname": lastname,
        "firstname": firstname,
        "course": course,
        "level": level,
        "image": final_image or ""
    }

    # handle ID change
    if new_idno and new_idno != idno:
        update_data["idno"] = new_idno
        where_id = idno
    else:
        where_id = idno

    updaterecord("students", **{"idno": where_id, **update_data})

    flash("Student updated", "success")
    return redirect(url_for("index"))

@app.route("/delete/<idno>")
def delete_student(idno):
    existing = getrecord("students", idno=idno)
    if existing:
        old_image = existing[0]["image"] if "image" in existing[0] else ""
        if old_image:
            remove_image(old_image)
    deleterecord("students", idno=idno)
    flash("Student deleted", "success")
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(debug=True)