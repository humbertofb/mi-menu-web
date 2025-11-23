from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# In-memory storage for products
# Pre-populating with some example data
products = [
    {"id": 1, "name": "Cerveza", "price": 2.50},
    {"id": 2, "name": "Vino", "price": 3.00},
    {"id": 3, "name": "Tapa de Jamón", "price": 5.00},
    {"id": 4, "name": "Patatas Bravas", "price": 4.50},
]

@app.route('/')
def index():
    return render_template('index.html', products=products)

@app.route('/add_product', methods=['POST'])
def add_product():
    data = request.json
    new_product = {
        "id": len(products) + 1,
        "name": data['name'],
        "price": float(data['price'])
    }
    products.append(new_product)
    return jsonify(new_product)

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    selected_product_ids = data.get('selected_ids', [])
    
    total_food = 0
    selected_items = []
    
    for p in products:
        if p['id'] in selected_product_ids:
            total_food += p['price']
            selected_items.append(p)
            
    # Fixed costs
    DINERS = 4
    DRINK_PRICE_PER_PERSON = 7.50
    total_drinks = DRINK_PRICE_PER_PERSON * DINERS
    
    total_bill = total_food + total_drinks
    price_per_person = total_bill / DINERS
    
    return jsonify({
        "total_food": total_food,
        "total_drinks": total_drinks,
        "total_bill": total_bill,
        "price_per_person": price_per_person,
        "diners": DINERS
    })

if __name__ == '__main__':
    app.run(debug=True)
