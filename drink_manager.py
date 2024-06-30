import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import sqlite3
import json

class DrinkApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Drink Manager")

        self.load_window_size()
        self.setup_styles()
        self.setup_gui()

    def load_window_size(self):
        try:
            with open("window_size.json", "r") as f:
                size = json.load(f)
                self.root.geometry(f"{size['width']}x{size['height']}")
        except FileNotFoundError:
            self.root.geometry("800x600")

    def save_window_size(self):
        size = {"width": self.root.winfo_width(), "height": self.root.winfo_height()}
        with open("window_size.json", "w") as f:
            json.dump(size, f)

    def setup_styles(self):
        self.style = ttk.Style()
        self.style.theme_use('clam')

        # Light mode style
        self.style.configure('TButton', background='#e1e1e1', foreground='black')
        self.style.configure('TFrame', background='white')
        self.style.configure('TLabel', background='white', foreground='black')

        # Dark mode style
        self.style.configure('Dark.TButton', background='#333333', foreground='white')
        self.style.configure('Dark.TFrame', background='black')
        self.style.configure('Dark.TLabel', background='black', foreground='white')

    def setup_gui(self):
        self.categories_frame = ttk.Frame(self.root)
        self.categories_frame.pack()

        self.back_button = ttk.Button(self.categories_frame, text="Back", command=self.back_to_categories, style='TButton')
        self.back_button.pack(side=tk.LEFT)

        self.refill_button = ttk.Button(self.categories_frame, text="Refill Bottles", command=self.refill_bottles, style='TButton')
        self.refill_button.pack(side=tk.LEFT)

        self.mode_button = ttk.Button(self.categories_frame, text="Toggle Mode", command=self.toggle_mode, style='TButton')
        self.mode_button.pack(side=tk.LEFT)

        self.load_categories()

        self.drinks_frame = ttk.Frame(self.root)
        self.drinks_frame.pack()

        self.bottles_frame = ttk.Frame(self.root)
        self.bottles_frame.pack()

        self.current_mode = "light"
        self.apply_mode()

    def load_categories(self):
        for widget in self.categories_frame.winfo_children():
            if widget != self.back_button and widget != self.refill_button and widget != self.mode_button:
                widget.destroy()

        conn = sqlite3.connect('drink_database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT category FROM drinks')
        categories = cursor.fetchall()
        conn.close()

        for category in categories:
            button = ttk.Button(self.categories_frame, text=category[0], command=lambda cat=category[0]: self.load_drinks(cat), style='TButton')
            button.pack(side=tk.LEFT)

        self.back_button.pack_forget()

    def load_drinks(self, category):
        for widget in self.drinks_frame.winfo_children():
            widget.destroy()

        conn = sqlite3.connect('drink_database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT id, name FROM drinks WHERE category = ?', (category,))
        drinks = cursor.fetchall()
        conn.close()

        for drink in drinks:
            button = ttk.Button(self.drinks_frame, text=drink[1], command=lambda dr=drink[0]: self.make_drink(dr), style='TButton')
            button.pack(side=tk.LEFT)

        self.back_button.pack(side=tk.LEFT)

    def back_to_categories(self):
        for widget in self.drinks_frame.winfo_children():
            widget.destroy()
        self.load_categories()

    def make_drink(self, drink_id):
        conn = sqlite3.connect('drink_database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT ingredients, amounts FROM drinks WHERE id = ?', (drink_id,))
        drink = cursor.fetchone()
        ingredients = drink[0].split(',')
        amounts = list(map(int, drink[1].split(',')))

        for ingredient, amount in zip(ingredients, amounts):
            cursor.execute('SELECT volume FROM bottles WHERE name = ?', (ingredient,))
            volume = cursor.fetchone()[0]
            if volume < amount:
                messagebox.showerror("Error", f"Not enough {ingredient} to make this drink")
                conn.close()
                return

        for ingredient, amount in zip(ingredients, amounts):
            cursor.execute('UPDATE bottles SET volume = volume - ? WHERE name = ?', (amount, ingredient))

        conn.commit()
        conn.close()

        self.check_bottles()

    def refill_bottles(self):
        conn = sqlite3.connect('drink_database.db')
        cursor = conn.cursor()
        cursor.execute('UPDATE bottles SET volume = 70')
        conn.commit()
        conn.close()
        self.check_bottles()

    def check_bottles(self):
        for widget in self.bottles_frame.winfo_children():
            widget.destroy()

        conn = sqlite3.connect('drink_database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT name, volume FROM bottles')
        bottles = cursor.fetchall()
        conn.close()

        for bottle in bottles:
            label = ttk.Label(self.bottles_frame, text=f"{bottle[0]}: {bottle[1]} cl", style='TLabel')
            if bottle[1] < 20:
                label.config(foreground="red")
            label.pack()

    def apply_mode(self):
        if self.current_mode == "dark":
            self.root.config(bg="black")
            self.categories_frame.config(style='Dark.TFrame')
            self.drinks_frame.config(style='Dark.TFrame')
            self.bottles_frame.config(style='Dark.TFrame')
            for widget in self.categories_frame.winfo_children():
                widget.config(style='Dark.TButton')
            for widget in self.drinks_frame.winfo_children():
                widget.config(style='Dark.TButton')
            for widget in self.bottles_frame.winfo_children():
                widget.config(style='Dark.TLabel')
        else:
            self.root.config(bg="white")
            self.categories_frame.config(style='TFrame')
            self.drinks_frame.config(style='TFrame')
            self.bottles_frame.config(style='TFrame')
            for widget in self.categories_frame.winfo_children():
                widget.config(style='TButton')
            for widget in self.drinks_frame.winfo_children():
                widget.config(style='TButton')
            for widget in self.bottles_frame.winfo_children():
                widget.config(style='TLabel')

    def toggle_mode(self):
        self.current_mode = "dark" if self.current_mode == "light" else "light"
        self.apply_mode()

if __name__ == "__main__":
    root = tk.Tk()
    app = DrinkApp(root)
    root.protocol("WM_DELETE_WINDOW", app.save_window_size)
    root.mainloop()
