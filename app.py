import os
import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static')
)

# Modelni xotiraga yuklash (Vercel serverless uchun to'liq nisbiy yo'l)
MODEL_PATH = os.path.join(BASE_DIR, 'titanic_model.joblib')
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"'{MODEL_PATH}' topilmadi! Iltimos, oldin 'train_model.py' ni bajaring.")

model = joblib.load(MODEL_PATH)
print(f"[*] ML modeli muvaffaqiyatli yuklandi: {MODEL_PATH}")


@app.route('/')
def index():
    """Asosiy sahifani yuklash."""
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    """Foydalanuvchi ma'lumotlari asosida omon qolish ehtimolini hisoblash."""
    try:
        data = request.get_json(force=True)
        
        name = str(data.get('name', 'Noma\'lum Yo\'lovchi')).strip()
        title = str(data.get('title', 'Mr')).strip()
        pclass = int(data.get('pclass', 3))
        sex = str(data.get('sex', 'male')).lower().strip()
        age = float(data.get('age', 28.0))
        fare = float(data.get('fare', 15.0))
        embarked = str(data.get('embarked', 'S')).upper().strip()
        sibsp = int(data.get('sibsp', 0))
        parch = int(data.get('parch', 0))

        # 1. Feature Engineering
        family_size = sibsp + parch + 1
        is_alone = 1 if family_size == 1 else 0

        # DataFrame yaratish
        input_df = pd.DataFrame([{
            'pclass': pclass,
            'sex': sex,
            'age': age,
            'sibsp': sibsp,
            'parch': parch,
            'fare': fare,
            'embarked': embarked,
            'family_size': family_size,
            'is_alone': is_alone
        }])

        # 2. Bashorat
        probabilities = model.predict_proba(input_df)[0]
        # probabilities[0] -> Vafot etish, probabilities[1] -> Omon qolish
        survived_prob = round(float(probabilities[1]) * 100, 1)

        # 3. Dramatik xulosa
        if survived_prob > 60.0:
            verdict = "Tabriklaymiz! Birinchi qutqaruv qayiqlari sizni olib ketishga ulguradi."
            stamp_status = "SURVIVED"
            stamp_type = "survived"
        elif 40.0 <= survived_prob <= 60.0:
            verdict = "Vaziyat qaltis! Muzdek okean bilan yuzma-yuzsiz, qutqaruv jiletingizni qidiring..."
            stamp_status = "UNRESOLVED"
            stamp_type = "uncertain"
        else:
            verdict = "Afsuski, 3-klassning quyi qavatlari suv ostida qolmoqda..."
            stamp_status = "LOST AT SEA"
            stamp_type = "perished"

        # 4. Eng muhim 2 ta omilni dinamik tanlash
        factors = []
        
        # Oila / Bola omili
        if age < 14:
            factors.append(f"Yosh bola ({int(age)} yosh) ekanligingiz 'Ayollar va bolalar avval' qoidasi bo'yicha sizga mutlaq ustunlik berdi.")
        elif sex == 'female':
            factors.append("Ayol yo'lovchi bo'lganingiz qutqaruv qayiqlariga birinchilardan bo'lib chiqish imkoniyatini ta'minladi.")
        else:
            factors.append("Erkak yo'lovchilarga faqat barcha ayollar va bolalar qayiqlarga o'tirib bo'lgach ruxsat berilgani xavfni oshirdi.")

        # Klass va Paluba omili
        if pclass == 1:
            factors.append(f"1-klass hashamatli lyuks yo'lovchisi bo'lganingiz (£{fare:.1f}) qayiqlar joylashgan yuqori palubaga bevosita tez chiqish imkonini yaratdi.")
        elif pclass == 2:
            factors.append("2-klass yo'lovchilari uchun o'rta palubadan qutqaruv zonalariga chiqish nisbatan tez tashkillashtirildi.")
        else:
            factors.append("3-klass umumiy palubasi kemaning eng quyi qavatlarida joylashgani va suv toshishida to'siqlar bo'lgani qutqarilishni qiyinlashtirdi.")

        return jsonify({
            'success': True,
            'name': name,
            'title': title,
            'survived_prob': survived_prob,
            'stamp_status': stamp_status,
            'stamp_type': stamp_type,
            'verdict': verdict,
            'factors': factors[:2],
            'details': {
                'pclass': pclass,
                'sex': 'Erkak' if sex == 'male' else 'Ayol',
                'age': age,
                'fare': fare,
                'family_size': family_size,
                'embarked': {'S': 'Southampton', 'C': 'Cherbourg', 'Q': 'Queenstown'}.get(embarked, embarked)
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


if __name__ == '__main__':
    print("[*] Flask server ishga tushirilmoqda...")
    print("[*] URL: http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
