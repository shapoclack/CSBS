import lightgbm as lgb
import pandas as pd
import numpy as np

print("1. Генерация исторических данных коворкинга...")
np.random.seed(42)

# Генерируем данные за 1000 дней
days = np.random.randint(0, 7, 1000) # 0 - Пн, 6 - Вс
is_weekend = (days >= 5).astype(int)

# Логика загруженности коворкинга:
# Вторник, Среда, Четверг (1, 2, 3) - самые загруженные дни (~85%)
# Понедельник (0) - люди раскачиваются (~75%)
# Пятница (4) - короткий день, загрузка падает (~60%)
# Выходные (5, 6) - пустовато (~20%)
base_workload = np.where(np.isin(days, [1, 2, 3]), 85,
                np.where(days == 0, 75,
                np.where(days == 4, 60, 20)))

# Добавляем случайный шум (±5-10%), так как в жизни не бывает идеальных совпадений
workload = base_workload + np.random.normal(0, 8, 1000)
workload = np.clip(workload, 0, 100) # Загрузка строго от 0 до 100%

# Собираем в таблицу
df = pd.DataFrame({
    'day_of_week': days, 
    'is_weekend': is_weekend, 
    'workload': workload
})

print("2. Настройка параметров LightGBM...")
# day_of_week и is_weekend указываем как категориальные признаки
X = df[['day_of_week', 'is_weekend']]
y = df['workload']
train_data = lgb.Dataset(X, label=y, categorical_feature=['day_of_week', 'is_weekend'])

# Параметры дерева решений
params = {
    'objective': 'regression', # Предсказываем число (процент)
    'metric': 'rmse',          # Ошибка в процентах загрузки
    'learning_rate': 0.05,
    'num_leaves': 15,          # Небольшое дерево, чтобы не переобучилось
    'verbose': -1
}

print("3. Запуск обучения...")
bst = lgb.train(params, train_data, num_boost_round=150)

print("4. Сохранение модели...")
# Экспортируем веса в текстовый файл
bst.save_model('workload_model.txt')
print("✅ Успех! Файл 'workload_model.txt' создан.")