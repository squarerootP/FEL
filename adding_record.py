import json
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import shutil
import os
from datetime import datetime
from pathlib import Path

# CONFIG: path to your existing JSON data file
DATA_FILE = Path(r"C:\Users\Admin\FEL\assets\data\data.json")
OUTPUT_FILE = Path(r"C:\Users\Admin\FEL\assets\data\data.json")  # where to save after edits

# Load data.json -> six lists
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract lists (hippo left untouched)
events = data.get('events', [])
filterEvents = data.get('filterEvents', [])
semesters = data.get('semesters', [])
honorableExecutiveBoardMembers = data.get('honorableExecutiveBoardMembers', [])
honorableClubMembers = data.get('honorableClubMembers', [])
hippo = data.get('hippo')  # not altered

# Helper: resolve field names dynamically when needed
def get_semesters_fields():
    if semesters:
        return list(semesters[0].keys())
    # Fallback template if list empty
    return ['semester']

def get_exec_board_fields():
    if honorableExecutiveBoardMembers:
        return list(honorableExecutiveBoardMembers[0].keys())
    # Reasonable guess template
    return ['name', 'role', 'image', 'major', 'bio', 'semester']

# Static field maps for lists with fixed/known schema
FIELD_MAP_STATIC = {
    'events': ['image', 'title', 'date', 'description', 'tag', 'url'],
    'filterEvents': ['tag'],
    'honorableClubMembers': ['name', 'role', 'image', 'achievements', 'contributions', 'background', 'semester'],
}

# Map list name -> underlying Python list object
TARGET_LISTS = {
    'events': events,
    # 'filterEvents': filterEvents,  # kept for saving only, not selectable for adding
    'semesters': semesters,
    'honorableExecutiveBoardMembers': honorableExecutiveBoardMembers,
    'honorableClubMembers': honorableClubMembers,
}

MULTILINE_FIELDS = {'description', 'achievements', 'contributions', 'background'}
DATE_FIELDS = {'date'}  # auto-validate to YYYY-MM-DD

class RecordGUI:
    def __init__(self, root):
        self.root = root
        self.root.title('Insert New Record')
        self.root.geometry('640x600')

        self.selected_list_name = tk.StringVar(value='events')

        # Top selection frame
        sel_frame = ttk.Frame(root)
        sel_frame.pack(fill='x', padx=10, pady=10)
        ttk.Label(sel_frame, text='Select Target List:').pack(side='left')
        selectable_lists = list(TARGET_LISTS.keys())  # filterEvents removed
        self.list_combo = ttk.Combobox(
            sel_frame,
            textvariable=self.selected_list_name,
            values=selectable_lists,
            state='readonly'
        )
        self.list_combo.pack(side='left', padx=8)
        self.list_combo.bind('<<ComboboxSelected>>', lambda e: self.rebuild_fields())

        # Scrollable field area
        container = ttk.Frame(root)
        container.pack(fill='both', expand=True, padx=10, pady=(0,10))

        canvas = tk.Canvas(container, borderwidth=0)
        self.fields_frame = ttk.Frame(canvas)
        vsb = ttk.Scrollbar(container, orient='vertical', command=canvas.yview)
        canvas.configure(yscrollcommand=vsb.set)

        vsb.pack(side='right', fill='y')
        canvas.pack(side='left', fill='both', expand=True)
        canvas.create_window((0,0), window=self.fields_frame, anchor='nw')

        self.fields_frame.bind('<Configure>', lambda e: canvas.configure(scrollregion=canvas.bbox('all')))

        # Action buttons
        btn_frame = ttk.Frame(root)
        btn_frame.pack(fill='x', padx=10, pady=5)
        ttk.Button(btn_frame, text='Add Record', command=self.add_record).pack(side='left')
        ttk.Button(btn_frame, text='Save To File', command=self.save_all).pack(side='left', padx=5)
        ttk.Button(btn_frame, text='Quit', command=root.destroy).pack(side='right')

        # Status bar
        self.status_var = tk.StringVar(value='Ready')
        status = ttk.Label(root, textvariable=self.status_var, relief='sunken', anchor='w')
        status.pack(fill='x', side='bottom')

        self.field_widgets = {}
        self.rebuild_fields()

    def resolve_fields_for(self, list_name: str):
        if list_name == 'semesters':
            return get_semesters_fields()
        if list_name == 'honorableExecutiveBoardMembers':
            return get_exec_board_fields()
        return FIELD_MAP_STATIC[list_name]

    def clear_fields(self):
        for w in self.fields_frame.winfo_children():
            w.destroy()
        self.field_widgets.clear()

    def rebuild_fields(self):
        self.clear_fields()
        list_name = self.selected_list_name.get()
        fields = self.resolve_fields_for(list_name)

        for idx, field in enumerate(fields):
            row = ttk.Frame(self.fields_frame)
            row.pack(fill='x', pady=3)
            label = ttk.Label(row, text=field + ':', width=18, anchor='w')
            label.pack(side='left')
            if field in MULTILINE_FIELDS:
                text_widget = tk.Text(row, height=4, width=50, wrap='word')
                text_widget.pack(side='left', fill='x', expand=True)
                self.field_widgets[field] = text_widget
            elif field == 'image':
                # Entry plus browse button
                img_frame = ttk.Frame(row)
                img_frame.pack(side='left', fill='x', expand=True)
                entry = ttk.Entry(img_frame, width=44)
                entry.pack(side='left', fill='x', expand=True)
                browse_btn = ttk.Button(img_frame, text='Browse', width=8, command=lambda e=entry: self.browse_image(e))
                browse_btn.pack(side='left', padx=4)
                self.field_widgets[field] = entry
            else:
                entry = ttk.Entry(row, width=52)
                entry.pack(side='left', fill='x', expand=True)
                self.field_widgets[field] = entry

        # Helpful hints
        hint_text = []
        if any(f in DATE_FIELDS for f in fields):
            hint_text.append("Date format: YYYY-MM-DD")
        if list_name == 'semesters':
            hint_text.append("Example semester value: FA24 / SP25")
        if list_name == 'events':
            hint_text.append("Fields 'description' can be multiline.")
        if hint_text:
            hint_label = ttk.Label(self.fields_frame, text=' | '.join(hint_text), foreground='gray')
            hint_label.pack(fill='x', pady=4)

    def gather_field_values(self):
        record = {}
        for field, widget in self.field_widgets.items():
            if isinstance(widget, tk.Text):
                value = widget.get('1.0', 'end').strip()
            else:
                value = widget.get().strip()
            if field in DATE_FIELDS and value:
                # Validate & normalize
                try:
                    dt = datetime.fromisoformat(value)
                    value = dt.strftime('%Y-%m-%d')
                except ValueError:
                    # Try common patterns
                    for fmt in ('%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y'):
                        try:
                            dt = datetime.strptime(value, fmt)
                            value = dt.strftime('%Y-%m-%d')
                            break
                        except ValueError:
                            pass
                    else:
                        raise ValueError(f"Invalid date for field '{field}': {value}")
            record[field] = value
        return record

    def browse_image(self, entry_widget: ttk.Entry):
        """Open a file dialog to choose an image file and insert its path into the entry."""
        file_path = filedialog.askopenfilename(
            title='Select Image',
            filetypes=[
                ('Image Files', '*.png *.jpg *.jpeg *.gif *.webp *.bmp'),
                ('All Files', '*.*')
            ]
        )
        if file_path:
            # Normalize path to use forward slashes for potential web usage
            norm = Path(file_path).as_posix()
            entry_widget.delete(0, 'end')
            entry_widget.insert(0, norm)

    def add_record(self):
        list_name = self.selected_list_name.get()
        target_list = TARGET_LISTS[list_name]
        try:
            record = self.gather_field_values()
        except ValueError as e:
            messagebox.showerror('Validation Error', str(e))
            return

        # Basic required checks (non-empty) for core fields
        missing = [k for k,v in record.items() if v == '' and list_name != 'filterEvents']
        if missing:
            if not messagebox.askyesno('Confirm', f"Fields empty: {', '.join(missing)}. Add anyway?"):
                return

        # Handle image copying if needed
        if 'image' in record and record['image']:
            record['image'] = self.process_image_path(list_name, record['image'])

        target_list.append(record)
        self.status_var.set(f"Added new record to {list_name}. Total now: {len(target_list)}")
        messagebox.showinfo('Success', f'Record added to {list_name}.')
        # Clear entries for next input
        for field, widget in self.field_widgets.items():
            if isinstance(widget, tk.Text):
                widget.delete('1.0', 'end')
            else:
                widget.delete(0, 'end')

    def save_all(self):
        # Compose new data dict (hippo unchanged)
        new_data = {
            'events': events,
            'filterEvents': filterEvents,
            'semesters': semesters,
            'honorableExecutiveBoardMembers': honorableExecutiveBoardMembers,
            'honorableClubMembers': honorableClubMembers,
            'hippo': hippo,
        }
        try:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(new_data, f, ensure_ascii=False, indent=4)
            messagebox.showinfo('Saved', f'Data written to\n{OUTPUT_FILE}')
            self.status_var.set(f'Saved to {OUTPUT_FILE}')
        except Exception as e:
            messagebox.showerror('Save Failed', str(e))
            self.status_var.set('Save failed')

    # ---------------- Image handling -----------------
    def process_image_path(self, list_name: str, src_path: str) -> str:
        """Copy image into appropriate assets folder and return new relative path.
        Skips if src_path looks like a URL (http/https) or file not found.
        """
        if src_path.lower().startswith(('http://', 'https://', 'data:')):
            return src_path  # leave remote or data URI as-is

        if not os.path.isfile(src_path):
            messagebox.showwarning('Image Not Found', f'Image file not found: {src_path}\nRecord will store original value.')
            return src_path

        # Determine destination directory
        assets_root = DATA_FILE.parent.parent  # .../assets
        if list_name == 'events':
            dest_dir = assets_root / 'images' / 'events'
        elif list_name in ('honorableExecutiveBoardMembers', 'honorableClubMembers'):
            dest_dir = assets_root / 'images' / 'people'
        else:
            # Other lists don't manage images specially
            return src_path

        dest_dir.mkdir(parents=True, exist_ok=True)
        filename = os.path.basename(src_path)
        name, ext = os.path.splitext(filename)
        dest_path = dest_dir / filename

        # Avoid overwriting: add numeric suffix if file exists but has different content
        counter = 1
        while dest_path.exists():
            # If same file (size match) assume OK reuse
            if os.path.getsize(src_path) == os.path.getsize(dest_path):
                break
            dest_path = dest_dir / f"{name}_{counter}{ext}"
            counter += 1
        try:
            if not dest_path.exists():
                shutil.copy2(src_path, dest_path)
        except Exception as e:
            messagebox.showwarning('Copy Failed', f'Could not copy image: {e}\nUsing original path.')
            return src_path

        # Return web-style relative path from assets root (using forward slashes)
        rel_path = dest_path.relative_to(assets_root.parent).as_posix()
        return rel_path


def main():
    root = tk.Tk()
    RecordGUI(root)
    root.mainloop()

if __name__ == '__main__':
    main()
