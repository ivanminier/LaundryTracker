
from flask import Flask, jsonify, request
from playwright.sync_api import sync_playwright

app = Flask(__name__)

@app.route("/laundry-status", methods=["GET"])
def get_laundry_status():
    room_url = request.args.get("url")
    if not room_url:
        return jsonify({"error": "Missing URL parameter"}), 400

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(room_url, wait_until='networkidle')

            # Extract the laundry status table rows
            rows = page.query_selector_all("table#statusTable tbody tr")
            result = []
            for row in rows:
                cols = row.query_selector_all("td")
                if len(cols) >= 4:
                    machine = cols[1].inner_text().strip()
                    machine_type = cols[2].inner_text().strip()
                    status = cols[3].inner_text().strip()
                    result.append({
                        "machine": machine,
                        "type": machine_type,
                        "status": status
                    })
            browser.close()
            return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
