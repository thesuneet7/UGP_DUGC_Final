import sqlite3
from flask import Flask, jsonify, render_template

# --- Flask App Initialization ---
# This sets up the Flask web application.
# template_folder tells Flask to look for HTML files in the 'templates' directory.
app = Flask(__name__, template_folder='templates')

# --- Database Connection Function ---
def get_db_connection():
    """Creates a connection to the SQLite database."""
    # Establishes a connection to the database file.
    conn = sqlite3.connect('molecules_pubchem.db')
    # This allows you to access columns by name (like a dictionary).
    conn.row_factory = sqlite3.Row
    return conn

# --- API Endpoint to Get All Molecules ---
@app.route('/api/molecules')
def get_molecules():
    """Fetches a list of all molecules to populate the dropdown."""
    conn = get_db_connection()
    # SQL query to select the ID and name of each molecule.
    molecules = conn.execute('SELECT molecule_id, molecule_name FROM molecules ORDER BY molecule_name').fetchall()
    conn.close()
    # Converts the database rows to a list of dictionaries and sends it as JSON.
    return jsonify([dict(row) for row in molecules])

# --- API Endpoint to Get a Specific Molecule's XYZ Data ---
@app.route('/api/molecule/<int:molecule_id>')
def get_molecule_xyz(molecule_id):
    """Fetches the XYZ file content for a single molecule by its ID."""
    conn = get_db_connection()
    # Finds the molecule with the matching ID.
    molecule = conn.execute('SELECT xyz_filepath FROM molecules WHERE molecule_id = ?', (molecule_id,)).fetchone()
    conn.close()
    
    if molecule is None:
        # If no molecule is found, return a 404 error.
        return jsonify({"error": "Molecule not found"}), 404
    
    try:
        # Opens the XYZ file path stored in the database.
        with open(molecule['xyz_filepath'], 'r') as f:
            xyz_data = f.read()
        # Returns the raw text content of the XYZ file.
        return xyz_data, 200, {'Content-Type': 'text/plain'}
    except FileNotFoundError:
        return jsonify({"error": "XYZ file not found on server"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- API Endpoint to Get Molecule Details ---
@app.route('/api/molecule/<int:molecule_id>/details')
def get_molecule_details(molecule_id):
    """Fetches detailed information about a molecule including formula and weight."""
    conn = get_db_connection()
    # Gets all relevant molecule details
    molecule = conn.execute('''
        SELECT molecule_id, molecule_name, pubchem_cid, molecular_formula, 
               molecular_weight, free_energy, created_date 
        FROM molecules WHERE molecule_id = ?
    ''', (molecule_id,)).fetchone()
    conn.close()
    
    if molecule is None:
        return jsonify({"error": "Molecule not found"}), 404
    
    # Convert the database row to a dictionary and return as JSON
    return jsonify(dict(molecule))

# --- Main Route to Render the HTML Page ---
@app.route('/')
def index():
    """Serves the main HTML page."""
    # Renders and returns the index.html file from the 'templates' folder.
    return render_template('index.html')

# --- Main Execution Block ---
if __name__ == '__main__':
    # Starts the Flask development server.
    # debug=True allows for live reloading when you make code changes.
    # The app will be accessible at http://127.0.0.1:5000
    app.run(port=3000)
