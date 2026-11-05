import os
import seaborn as sns
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression


def prepare_data():
    """Seaborn orqali titanic datasetini yuklash va feature engineering."""
    print("[*] Seaborn orqali 'titanic' dataset yuklanmoqda...")
    df = sns.load_dataset('titanic')
    print(f"[+] Dataset yuklandi: {df.shape[0]} qator, {df.shape[1]} ustun.")

    # 1. Feature Engineering: family_size va is_alone
    df['sibsp'] = pd.to_numeric(df['sibsp'], errors='coerce').fillna(0)
    df['parch'] = pd.to_numeric(df['parch'], errors='coerce').fillna(0)
    df['family_size'] = df['sibsp'] + df['parch'] + 1
    df['is_alone'] = (df['family_size'] == 1).astype(int)

    # 2. X va y ajratish
    feature_cols = ['pclass', 'sex', 'age', 'sibsp', 'parch', 'fare', 'embarked', 'family_size', 'is_alone']
    X = df[feature_cols].copy()
    y = df['survived'].astype(int)

    return X, y


def build_pipeline():
    """ColumnTransformer va Preprocessing quvurini qurish."""
    # Raqamli va kategorik ustunlar
    numeric_features = ['age', 'fare', 'family_size', 'sibsp', 'parch']
    categorical_features = ['pclass', 'sex', 'embarked', 'is_alone']

    # Raqamli quvur: median imputer + StandardScaler
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Kategorik quvur: most_frequent imputer + OneHotEncoder
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    # ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ]
    )

    return preprocessor


def main():
    print("=" * 65)
    print("  TITANIC MACHINE LEARNING PIPELINE & GRIDSEARCHCV (FLASK BACKEND)")
    print("=" * 65)

    X, y = prepare_data()

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"O'qitish to'plami: {X_train.shape[0]} ta, Sinov to'plami: {X_test.shape[0]} ta")

    preprocessor = build_pipeline()

    # 3 ta model va giperparametrlar to'plami
    models_config = {
        'RandomForestClassifier': {
            'model': RandomForestClassifier(random_state=42),
            'param_grid': {
                'classifier__n_estimators': [50, 100, 200],
                'classifier__max_depth': [4, 6, 8, None],
                'classifier__min_samples_split': [2, 5, 10]
            }
        },
        'GradientBoostingClassifier': {
            'model': GradientBoostingClassifier(random_state=42),
            'param_grid': {
                'classifier__n_estimators': [50, 100, 150],
                'classifier__learning_rate': [0.01, 0.05, 0.1],
                'classifier__max_depth': [3, 4, 5]
            }
        },
        'LogisticRegression': {
            'model': LogisticRegression(max_iter=1000, random_state=42),
            'param_grid': {
                'classifier__C': [0.01, 0.1, 1.0, 10.0],
                'classifier__solver': ['lbfgs', 'liblinear']
            }
        }
    }

    best_score = 0.0
    best_pipeline = None
    best_model_name = ""
    best_params = None

    print("\n" + "-" * 65)
    print("  MODELLARNI BAHOLASH VA ENG YAXSHISINI TANLASH (5-Fold CV)")
    print("-" * 65)

    for name, cfg in models_config.items():
        print(f"\n>>> Baholanmoqda: {name}...")
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', cfg['model'])
        ])

        grid_search = GridSearchCV(
            estimator=pipeline,
            param_grid=cfg['param_grid'],
            cv=5,
            scoring='accuracy',
            n_jobs=-1,
            verbose=0
        )

        grid_search.fit(X_train, y_train)

        cv_acc = grid_search.best_score_
        best_cand = grid_search.best_estimator_
        test_acc = accuracy_score(y_test, best_cand.predict(X_test))

        print(f"    5-Fold CV Aniqligi: {cv_acc:.4f} ({cv_acc*100:.2f}%)")
        print(f"    Test To'plamida:   {test_acc:.4f} ({test_acc*100:.2f}%)")
        print(f"    Eng yaxshi parametrlar: {grid_search.best_params_}")

        if test_acc > best_score:
            best_score = test_acc
            best_pipeline = best_cand
            best_model_name = name
            best_params = grid_search.best_params_

    print("\n" + "=" * 65)
    print(f"  ENG YAXSHI MODEL: {best_model_name}")
    print(f"  Test Aniqligi (Accuracy): {best_score:.4f} ({best_score*100:.2f}%)")
    print("=" * 65)

    # Yakuniy hisobot
    y_pred = best_pipeline.predict(X_test)
    print("\nKlassifikatsiya hisoboti:")
    print(classification_report(y_test, y_pred, target_names=['Vafot etgan', 'Omon qolgan']))

    # Modelni saqlash
    output_file = 'titanic_model.joblib'
    joblib.dump(best_pipeline, output_file)
    print(f"[+] Yakuniy pipeline muvaffaqiyatli saqlandi: {output_file}")
    print(f"[+] Fayl hajmi: {os.path.getsize(output_file) / 1024:.2f} KB")


if __name__ == '__main__':
    main()
