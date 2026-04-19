import tkinter as tk
from tkinter import ttk, messagebox
import urllib.request
import json
import threading
import time
import random

class AntigravityMonitor:
    def __init__(self, root):
        self.root = root
        self.root.title("Antigravity Assistant | SkillSync AI Monitor")
        self.root.geometry("600x380")
        self.root.configure(bg="#06080A")
        self.root.resizable(False, False)
        
        self.is_monitoring = False
        
        # --- Theming & Styling ---
        style = ttk.Style()
        # Use a default theme we can modify
        style.theme_use("clam")
        
        # Configure overall themes
        style.configure("TFrame", background="#06080A")
        style.configure("TLabel", background="#06080A", foreground="#E2E8F0", font=("Inter", 11))
        style.configure("Header.TLabel", font=("Inter", 18, "bold"), foreground="#8B5CF6")
        style.configure("SubHeader.TLabel", font=("Inter", 10), foreground="#64748B")
        style.configure("Stats.TLabel", font=("Inter", 12), foreground="#A78BFA")
        
        # Button styling
        style.configure("Primary.TButton", 
                        background="#3B82F6", 
                        foreground="white", 
                        font=("Inter", 10, "bold"),
                        padding=10, borderwidth=0)
        style.map("Primary.TButton", background=[("active", "#2563EB")])
        style.configure("Danger.TButton", 
                        background="#EF4444", 
                        foreground="white", 
                        font=("Inter", 10, "bold"),
                        padding=10, borderwidth=0)
        style.map("Danger.TButton", background=[("active", "#DC2626")])
        
        # Custom progress bar thickness
        style.configure("Horizontal.TProgressbar", thickness=25, background="#10B981", troughcolor="#1E293B")
        
        self.build_ui()

    def build_ui(self):
        main_frame = ttk.Frame(self.root, padding=25)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Headers
        header = ttk.Label(main_frame, text="Antigravity Cloud Monitor", style="Header.TLabel")
        header.pack(pady=(0, 2))
        sub_header = ttk.Label(main_frame, text="Real-time linkage to SkillSync AI Apps Script Backend", style="SubHeader.TLabel")
        sub_header.pack(pady=(0, 20))
        
        # URL Input
        url_frame = ttk.Frame(main_frame)
        url_frame.pack(fill=tk.X, pady=(0, 20))
        ttk.Label(url_frame, text="Apps Script Web App URL:").pack(anchor=tk.W, pady=(0, 5))
        
        self.url_entry = ttk.Entry(url_frame, font=("Inter", 10), width=60)
        self.url_entry.pack(fill=tk.X, ipady=4)
        # The user's live Apps Script URL
        self.url_entry.insert(0, "https://script.google.com/macros/s/AKfycbyIydXwNXhDlhRNbSCa_KJCCZgFrGE57KpDrUnVisO7amtt63PWunIIicFjBTVyGy6u/exec")
        
        # Data Viewer
        self.progress_label = ttk.Label(main_frame, text="Overall Completion: 0%", font=("Inter", 26, "bold"), foreground="#10B981")
        self.progress_label.pack(pady=(10, 5))
        
        self.progress_bar = ttk.Progressbar(main_frame, style="Horizontal.TProgressbar", orient="horizontal", mode="determinate", length=500)
        self.progress_bar.pack(pady=10)
        
        # Stats Details
        self.stats_var = tk.StringVar(value="Status: Waiting to Fetch")
        self.stats_label = ttk.Label(main_frame, textvariable=self.stats_var, style="Stats.TLabel")
        self.stats_label.pack(pady=(0, 20))
        
        # Button controls
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill=tk.X)
        
        self.fetch_btn = ttk.Button(btn_frame, text="Fetch Stats Now", style="Primary.TButton", command=self.fetch_once)
        self.fetch_btn.pack(side=tk.LEFT, padx=(0, 10), expand=True, fill=tk.X)
        
        self.monitor_btn = ttk.Button(btn_frame, text="Start Real-time Ping", style="Primary.TButton", command=self.toggle_monitor)
        self.monitor_btn.pack(side=tk.LEFT, padx=(10, 0), expand=True, fill=tk.X)

    def fetch_data(self):
        url = self.url_entry.get().strip()
        # If URL looks like placeholder or is missing, use simulation mode to demonstrate the UI
        if "YOUR_DEPLOYMENT_ID" in url or not url.startswith("http"):
            return self.simulate_data()
            
        try:
            # Hit the getProgress API
            fetch_url = url + "?action=getProgress" if "?" not in url else url + "&action=getProgress"
            req = urllib.request.Request(fetch_url)
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                return data
        except Exception as e:
            return {"error": str(e)}

    def simulate_data(self):
        # Generates a random realistic completion value to show off UI
        total = random.randint(150, 450)
        completed = random.randint(30, total)
        percent = int((completed / total) * 100)
        return {"completion": percent, "total": total, "completed": completed, "simulated": True}

    def update_ui(self, data):
        if "error" in data:
            self.stats_var.set(f"Connection Error: {data['error'][:40]}...")
            self.progress_label.config(foreground="#EF4444")  # Red for error
            return
            
        completion = int(data.get("completion", 0))
        self.progress_label.config(text=f"Overall Completion: {completion}%", foreground="#10B981")
        self.progress_bar["value"] = completion
        
        total = data.get("total", 0)
        completed = data.get("completed", 0)
        prefix = "⚡ [SIMULATED MODE] " if data.get("simulated") else "☁️ [LIVE DB] "
        time_str = time.strftime('%H:%M:%S')
        self.stats_var.set(f"{prefix}Tasks: {completed} / {total} Completed  (Last Sync: {time_str})")

    def fetch_once(self):
        self.fetch_btn.state(["disabled"])
        self.stats_var.set("Fetching from cloud...")
        def task():
            data = self.fetch_data()
            time.sleep(0.3) # Add small realistic delay
            self.root.after(0, self.update_ui, data)
            self.root.after(0, lambda: self.fetch_btn.state(["!disabled"]))
        threading.Thread(target=task, daemon=True).start()

    def toggle_monitor(self):
        if not self.is_monitoring:
            self.is_monitoring = True
            self.monitor_btn.config(text="Stop Auto-Monitor", style="Danger.TButton")
            self.url_entry.state(["disabled"])
            self.fetch_btn.state(["disabled"])
            threading.Thread(target=self.monitor_loop, daemon=True).start()
        else:
            self.is_monitoring = False
            self.monitor_btn.config(text="Start Real-time Ping", style="Primary.TButton")
            self.url_entry.state(["!disabled"])
            self.fetch_btn.state(["!disabled"])
            self.stats_var.set("Auto-monitor stopped.")

    def monitor_loop(self):
        while self.is_monitoring:
            data = self.fetch_data()
            self.root.after(0, self.update_ui, data)
            # Sleep 3 seconds between cloud pings
            for _ in range(30):
                if not self.is_monitoring:
                    break
                time.sleep(0.1)

if __name__ == "__main__":
    root = tk.Tk()
    app = AntigravityMonitor(root)
    root.mainloop()
