import os
import time
import psutil

def get_total_memory_usage(process):
    """Recursively sum memory usage of process and all children (in MB)."""
    try:
        mem = process.memory_info().rss
        for child in process.children(recursive=True):
            mem += child.memory_info().rss
        return mem / (1024 * 1024)
    except Exception as e:
        return 0

def log_memory_usage(interval=5, duration=600, log_file="memory_usage.log"):
    pid = os.getpid()
    process = psutil.Process(pid)
    max_mem = 0
    with open(log_file, "w") as f:
        f.write("timestamp,total_rss_MB\n")
        for _ in range(int(duration / interval)):
            mem = get_total_memory_usage(process)
            max_mem = max(max_mem, mem)
            f.write(f"{time.time()},{mem:.2f}\n")
            f.flush()
            time.sleep(interval)
        f.write(f"Peak total memory usage: {max_mem:.2f} MB\n")

if __name__ == "__main__":
    log_memory_usage()
