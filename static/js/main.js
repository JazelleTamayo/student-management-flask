document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const idnoField = document.getElementById('idno');
    const lastnameField = document.getElementById('lastname');
    const firstnameField = document.getElementById('firstname');
    const courseField = document.getElementById('course');
    const levelField = document.getElementById('level');
    const editIdField = document.getElementById('edit_idno');
    const currentImageField = document.getElementById('current_image');
    const saveBtn = form ? form.querySelector('input[type="submit"]') : null;

    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');

    const errorModal = document.getElementById('errorModal');
    const errorMessageEl = document.getElementById('errorMessage');

    const imageInput = document.getElementById('imageInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarIcon = document.querySelector('.avatar-icon');

    // Uppercase visual
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.addEventListener('input', () => { input.value = input.value.toString().toUpperCase(); });
    });

    // Trigger file picker when clicking avatar or small icon
    [avatarPreview, avatarIcon].forEach(el => {
        if (el) {
            el.addEventListener('click', () => imageInput.click());
        }
    });

    // Image live preview
    if (imageInput && avatarPreview) {
        imageInput.addEventListener('change', function () {
            const file = this.files && this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => { avatarPreview.src = e.target.result; };
            reader.readAsDataURL(file);
        });
    }

    // Edit student
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const row = e.target.closest('tr');
            if (!row || !form) return;

            idnoField.value = row.dataset.idno || '';
            lastnameField.value = (row.dataset.lastname || '').toUpperCase();
            firstnameField.value = (row.dataset.firstname || '').toUpperCase();
            courseField.value = (row.dataset.course || '').toLowerCase();
            levelField.value = row.dataset.level || '';
            editIdField.value = row.dataset.idno || '';

            // Avatar preview (use stored image or default)
            if (row.dataset.image && row.dataset.image.trim() !== "") {
                avatarPreview.src = `/static/images/${row.dataset.image}`;
            } else {
                avatarPreview.src = avatarPreview.dataset.default;
            }

            // Set hidden current_image field
            if (currentImageField) {
                currentImageField.value = row.dataset.image || '';
            }

            if (saveBtn) saveBtn.value = 'UPDATE';
            form.scrollIntoView({behavior: 'smooth', block: 'center'});
        });
    });

    // Delete student
    let idToDelete = null;
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const row = e.target.closest('tr');
            if (!row) return;
            idToDelete = row.dataset.idno;
            const p = deleteModal.querySelector('p');
            if (p) p.textContent = `Are you sure you want to delete student ID ${idToDelete}?`;
            deleteModal.style.display = 'block';
        });
    });

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (!idToDelete) return;
            window.location.href = `/delete/${idToDelete}`;
        });
    }

    // Close modals on outside click or Escape
    window.addEventListener('click', ev => {
        if (ev.target === deleteModal) deleteModal.style.display = 'none';
        if (ev.target === errorModal) errorModal.style.display = 'none';
    });
    window.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') {
            deleteModal.style.display = 'none';
            errorModal.style.display = 'none';
        }
    });

    // Form submit (add or update)
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();

            const idno = (idnoField.value || '').trim();
            const lastname = (lastnameField.value || '').trim();
            const firstname = (firstnameField.value || '').trim();
            const course = (courseField.value || '').trim();
            const level = (levelField.value || '').trim();

            // Check if all fields are filled
            if (!idno || !lastname || !firstname || !course || !level) {
                errorMessageEl.textContent = 'All fields are required. Please complete the form.';
                errorModal.style.display = 'block';
                return;
            }

            // Check for duplicate ID number (works for both add and edit)
            const existingIds = Array.from(document.querySelectorAll('tr[data-idno]'))
                .map(row => row.dataset.idno);

            const currentId = editIdField.value || ""; // original ID if editing
            if (existingIds.includes(idno) && idno !== currentId) {
                errorMessageEl.textContent = `Student ID ${idno} already exists. Please use a unique ID number.`;
                errorModal.style.display = 'block';
                return;
            }

            // Include current_image in form submission
            if (currentImageField && !imageInput.value) {
                currentImageField.value = currentImageField.value; // keep current image if no new file
            }

            // Proceed with submission
            form.action = editIdField.value ? `/update/${editIdField.value}` : '/add';
            form.submit();
        });
    }

    // Reset form
    const resetBtn = form.querySelector('input[type="reset"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (saveBtn) saveBtn.value = 'SAVE';
            if (editIdField) editIdField.value = '';
            if (currentImageField) currentImageField.value = '';
            avatarPreview.src = avatarPreview.dataset.default;
            if (imageInput) imageInput.value = '';
        });
    }
});
