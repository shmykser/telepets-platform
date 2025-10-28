-- Import data to Supabase
-- Generated automatically

-- USERS

    INSERT INTO users (user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name, created_at, updated_at)
    VALUES ('273065571', NULL, 'Shmykser', 
            NULL, False, 
            NULL, NULL,
            '2025-08-10 20:11:39', '2025-08-22 09:00:47')
    ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        telegram_username = EXCLUDED.telegram_username,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = EXCLUDED.updated_at;
    

    INSERT INTO users (user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name, created_at, updated_at)
    VALUES ('test_user_1', NULL, NULL, 
            NULL, False, 
            NULL, NULL,
            '2025-08-18 17:25:34', NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        telegram_username = EXCLUDED.telegram_username,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = EXCLUDED.updated_at;
    

    INSERT INTO users (user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name, created_at, updated_at)
    VALUES ('test_user_2', NULL, NULL, 
            NULL, False, 
            NULL, NULL,
            '2025-08-18 17:26:30', NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        telegram_username = EXCLUDED.telegram_username,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = EXCLUDED.updated_at;
    

    INSERT INTO users (user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name, created_at, updated_at)
    VALUES ('test_user_5', NULL, NULL, 
            NULL, False, 
            NULL, NULL,
            '2025-08-21 14:35:44', NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        telegram_username = EXCLUDED.telegram_username,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = EXCLUDED.updated_at;
    

    INSERT INTO users (user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name, created_at, updated_at)
    VALUES ('test_user', 'test_username', 'test_username', 
            NULL, False, 
            NULL, NULL,
            '2025-08-21 17:01:09', NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        telegram_username = EXCLUDED.telegram_username,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = EXCLUDED.updated_at;
    

    INSERT INTO users (user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name, created_at, updated_at)
    VALUES ('default_user', NULL, NULL, 
            NULL, False, 
            NULL, NULL,
            '2025-10-25 11:25:28', NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        telegram_username = EXCLUDED.telegram_username,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = EXCLUDED.updated_at;
    

-- WALLETS

    INSERT INTO wallets (user_id, coins, coins_locked, total_earned, total_spent, created_at, updated_at)
    VALUES ('273065571', 0, 0, 0, 0, '2025-08-10 20:11:39', NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET coins = EXCLUDED.coins,
        updated_at = NOW();
    

    INSERT INTO wallets (user_id, coins, coins_locked, total_earned, total_spent, created_at, updated_at)
    VALUES ('test_user_1', 0, 0, 0, 0, '2025-08-18 17:25:34', NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET coins = EXCLUDED.coins,
        updated_at = NOW();
    

    INSERT INTO wallets (user_id, coins, coins_locked, total_earned, total_spent, created_at, updated_at)
    VALUES ('test_user_2', 0, 0, 0, 0, '2025-08-18 17:26:30', NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET coins = EXCLUDED.coins,
        updated_at = NOW();
    

    INSERT INTO wallets (user_id, coins, coins_locked, total_earned, total_spent, created_at, updated_at)
    VALUES ('test_user_5', 0, 0, 0, 0, '2025-08-21 14:35:44', NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET coins = EXCLUDED.coins,
        updated_at = NOW();
    

    INSERT INTO wallets (user_id, coins, coins_locked, total_earned, total_spent, created_at, updated_at)
    VALUES ('test_user', 0, 0, 0, 0, '2025-08-21 17:01:09', NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET coins = EXCLUDED.coins,
        updated_at = NOW();
    

    INSERT INTO wallets (user_id, coins, coins_locked, total_earned, total_spent, created_at, updated_at)
    VALUES ('default_user', 0, 0, 0, 0, '2025-10-25 11:25:28', NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET coins = EXCLUDED.coins,
        updated_at = NOW();
    

-- PETS

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'First', 'egg', 'alive', 0, 
            NULL,
            '2025-08-16 17:13:19', '2025-08-16 17:53:31.123356')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Sad', 'egg', 'alive', 0, 
            NULL,
            '2025-08-16 17:14:18', '2025-08-16 17:27:29.212707')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'vdfbv', 'egg', 'alive', 0, 
            NULL,
            '2025-08-16 17:25:36', '2025-08-17 06:06:31.486588')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'dsvsd', 'egg', 'alive', 0, 
            NULL,
            '2025-08-16 17:25:48', '2025-08-17 05:47:18.451568')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Sawed', 'egg', 'alive', 0, 
            NULL,
            '2025-08-16 18:24:36', '2025-08-17 06:07:31.594540')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'dfwf', 'egg', 'alive', 0, 
            NULL,
            '2025-08-16 18:43:09', '2025-08-17 05:31:15.625914')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'sf', 'egg', 'alive', 0, 
            NULL,
            '2025-08-16 18:43:23', '2025-08-17 05:31:15.625914')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Asdc', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 05:46:21', '2025-08-17 06:30:07.119569')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'zxswc', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 05:51:21', '2025-08-17 06:35:07.793517')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Azd', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 05:54:11', '2025-08-17 06:38:08.112826')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'vdfv', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 06:10:39', '2025-08-17 06:58:10.472502')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Zaxc', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 06:19:14', '2025-08-17 07:07:11.039097')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'xxv', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 06:46:02', '2025-08-17 07:33:11.936797')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'xc', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 07:32:58', '2025-08-17 08:20:14.553658')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 's', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 09:17:20', '2025-08-17 14:19:53.512507')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'vdsf', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 09:22:48', '2025-08-17 14:24:51.505309')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Coins', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 09:32:30', '2025-08-17 14:35:14.166949')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'cds', 'egg', 'alive', 0, 
            NULL,
            '2025-08-17 09:38:04', '2025-08-17 14:43:14.476979')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('test_user_2', 'Bobby', 'egg', 'alive', 0, 
            NULL,
            '2025-08-18 17:25:39', '2025-08-18 18:12:59.558392')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Sdefw', 'egg', 'alive', 0, 
            NULL,
            '2025-08-19 17:46:17', '2025-08-21 13:48:52.119454')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('test_user_1', 'Petr', 'egg', 'alive', 0, 
            NULL,
            '2025-08-21 13:51:31', '2025-08-21 16:25:46.612434')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Ershik', 'egg', 'alive', 0, 
            NULL,
            '2025-08-21 13:56:10', '2025-08-21 16:30:47.160074')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'asf', 'egg', 'alive', 0, 
            NULL,
            '2025-08-21 14:14:24', '2025-08-21 16:45:16.009082')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('test_user_1', 'Swaer', 'egg', 'alive', 0, 
            NULL,
            '2025-08-21 14:36:43', '2025-08-21 16:46:16.602115')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'jkbhjkb', 'egg', 'alive', 0, 
            NULL,
            '2025-08-21 17:59:51', '2025-08-21 18:50:49.667164')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Serfd', 'egg', 'alive', 77, 
            NULL,
            '2025-08-22 09:10:30', '2025-08-22 09:12:49.993305')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'DDDD', 'egg', 'alive', 97, 
            NULL,
            '2025-08-22 09:18:38', NULL)
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Asd', 'egg', 'alive', 66, 
            NULL,
            '2025-08-22 09:19:22', '2025-08-22 09:20:57.173136')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Dewfe', 'egg', 'alive', 65, 
            NULL,
            '2025-08-22 09:19:48', '2025-08-22 09:21:57.462779')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Sjhvhv', 'egg', 'alive', 73, 
            NULL,
            '2025-08-22 09:23:46', '2025-08-22 09:26:01.435503')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'ergrth', 'egg', 'alive', 76, 
            NULL,
            '2025-08-22 09:24:05', '2025-08-22 09:26:01.509677')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Derger', 'egg', 'alive', 75, 
            NULL,
            '2025-08-22 09:24:50', '2025-08-22 09:27:01.625812')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Sder', 'egg', 'alive', 86, 
            NULL,
            '2025-08-22 09:29:22', '2025-08-22 09:31:02.306032')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Swefewr', 'egg', 'alive', 92, 
            NULL,
            '2025-08-22 09:32:05', '2025-08-22 09:34:04.036499')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'SDwefer', 'egg', 'alive', 97, 
            NULL,
            '2025-08-22 09:33:31', '2025-08-22 09:34:04.170617')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'vefvb', 'egg', 'alive', 88, 
            NULL,
            '2025-08-22 09:37:06', '2025-08-22 09:39:05.576572')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'dfebvger', 'egg', 'alive', 0, 
            NULL,
            '2025-08-22 09:40:50', '2025-08-22 12:36:02.549892')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'BHbh', 'egg', 'alive', 0, 
            NULL,
            '2025-08-22 09:42:19', '2025-08-22 12:34:00.252544')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'Adwef', 'egg', 'alive', 0, 
            NULL,
            '2025-08-24 15:34:03', '2025-10-26 11:32:14.305053')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('273065571', 'CVfs', 'egg', 'alive', 0, 
            NULL,
            '2025-08-24 15:46:39', '2025-10-26 07:58:09.923812')
    ON CONFLICT DO NOTHING;
    

-- TRANSACTIONS

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 100, 0, 100, 
            'Начальные монеты', 'completed', '2025-08-10 20:11:39')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 50, 0, 50, 
            'Достижение: Первый питомец', 'completed', '2025-08-10 20:11:49')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-14 11:21:19')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца bvc (стадия: adult)', 'completed', '2025-08-14 13:44:57')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-14 17:28:05')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-14 17:28:06')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-14 17:28:07')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-14 17:28:07')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-14 17:28:07')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-14 17:28:07')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Aasfwev (стадия: egg)', 'completed', '2025-08-14 17:28:16')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Aasfwev (стадия: egg)', 'completed', '2025-08-14 17:28:18')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Aasfwev (стадия: egg)', 'completed', '2025-08-14 17:28:18')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Aasfwev (стадия: egg)', 'completed', '2025-08-14 17:28:20')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 10, 0, 10, 
            'Увеличение здоровья питомца dfwf (стадия: baby)', 'completed', '2025-08-14 18:35:01')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 10, 0, 10, 
            'Увеличение здоровья питомца dfwf (стадия: baby)', 'completed', '2025-08-14 18:35:02')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 10, 0, 10, 
            'Увеличение здоровья питомца dfwf (стадия: baby)', 'completed', '2025-08-14 18:35:03')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца dfwf (стадия: adult)', 'completed', '2025-08-14 18:35:41')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца dfwf (стадия: adult)', 'completed', '2025-08-14 18:35:42')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца aaaa (стадия: adult)', 'completed', '2025-08-14 18:46:51')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Turs (стадия: egg)', 'completed', '2025-08-14 18:55:38')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Turs (стадия: egg)', 'completed', '2025-08-14 18:55:43')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Turs (стадия: egg)', 'completed', '2025-08-14 18:56:14')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Turs (стадия: egg)', 'completed', '2025-08-14 18:56:18')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Увеличение здоровья питомца Turs (стадия: egg)', 'completed', '2025-08-14 19:01:42')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 10, 0, 10, 
            'Увеличение здоровья питомца Rust (стадия: baby)', 'completed', '2025-08-14 19:03:06')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 100, 0, 100, 
            'Покупка 100 монет за $0.99', 'completed', '2025-08-14 19:12:28')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 1000, 0, 1000, 
            'Покупка 1000 монет за $6.99', 'completed', '2025-08-14 19:12:33')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца Turs (стадия: adult)', 'completed', '2025-08-15 12:35:29')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 500, 0, 500, 
            'Платное создание нового питомца (dwf)', 'completed', '2025-08-16 16:34:03')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 500, 0, 500, 
            'Платное создание нового питомца (Sad)', 'completed', '2025-08-16 17:14:18')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 500, 0, 500, 
            'Платное создание нового питомца (dsvsd)', 'completed', '2025-08-16 17:25:48')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 300, 0, 300, 
            'Платное создание нового питомца (sf)', 'completed', '2025-08-16 18:43:23')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца dsvsd (стадия: baby)', 'completed', '2025-08-16 18:54:31')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца vdfbv (стадия: adult)', 'completed', '2025-08-16 19:14:07')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца dsvsd (стадия: adult)', 'completed', '2025-08-16 19:14:45')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:09')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:10')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:12')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:14')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца vdfbv (стадия: adult)', 'completed', '2025-08-16 19:15:23')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:30')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:30')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:31')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-16 19:15:32')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца Sawed (стадия: adult)', 'completed', '2025-08-16 19:15:43')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 15, 0, 15, 
            'Награда за игру puzzle: 76 очков', 'completed', '2025-08-17 16:24:21')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_1', 'earning', 100, 0, 100, 
            'Начальные монеты', 'completed', '2025-08-18 17:25:34')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_1', 'earning', 50, 0, 50, 
            'Достижение: Первый питомец', 'completed', '2025-08-18 17:25:43')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_2', 'earning', 100, 0, 100, 
            'Начальные монеты', 'completed', '2025-08-18 17:26:30')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_2', 'earning', 58, 0, 58, 
            'Покупка на рынке (аукцион 1)', 'completed', '2025-08-18 17:28:20')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_1', 'earning', 56, 0, 56, 
            'Продажа питомца на рынке (аукцион 1)', 'completed', '2025-08-18 17:28:20')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 57, 0, 57, 
            'Покупка на рынке (аукцион 5)', 'completed', '2025-08-21 14:11:25')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_1', 'earning', 55, 0, 55, 
            'Продажа питомца на рынке (аукцион 5)', 'completed', '2025-08-21 14:11:25')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 53, 0, 53, 
            'Покупка на рынке (аукцион 6)', 'completed', '2025-08-21 14:17:30')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_1', 'earning', 51, 0, 51, 
            'Продажа питомца на рынке (аукцион 6)', 'completed', '2025-08-21 14:17:30')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-21 14:20:47')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 5, 0, 5, 
            'Ежедневная награда за вход', 'completed', '2025-08-21 14:20:49')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_5', 'earning', 100, 0, 100, 
            'Начальные монеты', 'completed', '2025-08-21 14:35:44')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user_1', 'earning', 60, 0, 60, 
            'Покупка на рынке (аукцион 3)', 'completed', '2025-08-21 16:18:44')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 57, 0, 57, 
            'Продажа питомца на рынке (аукцион 3)', 'completed', '2025-08-21 16:18:45')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('test_user', 'earning', 100, 0, 100, 
            'Начальные монеты', 'completed', '2025-08-21 17:01:11')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 300, 0, 300, 
            'Платное создание нового питомца (Dewfe)', 'completed', '2025-08-22 09:19:48')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 300, 0, 300, 
            'Платное создание нового питомца (ergrth)', 'completed', '2025-08-22 09:24:05')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 300, 0, 300, 
            'Платное создание нового питомца (Derger)', 'completed', '2025-08-22 09:24:50')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 300, 0, 300, 
            'Платное создание нового питомца (SDwefer)', 'completed', '2025-08-22 09:33:30')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца dfebvger (стадия: egg)', 'completed', '2025-08-22 09:44:30')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 100, 0, 100, 
            'Покупка 100 монет за $0.99', 'completed', '2025-08-22 11:45:45')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 1000, 0, 1000, 
            'Покупка 1000 монет за $6.99', 'completed', '2025-08-22 11:45:52')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 20, 0, 20, 
            'Увеличение здоровья питомца Adwef (стадия: adult)', 'completed', '2025-08-24 15:36:37')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('default_user', 'earning', 100, 0, 100, 
            'Начальные монеты', 'completed', '2025-10-25 11:25:28')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца CVfs (стадия: adult)', 'completed', '2025-10-25 12:29:22')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца CVfs (стадия: adult)', 'completed', '2025-10-25 12:29:26')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца CVfs (стадия: adult)', 'completed', '2025-10-25 12:29:26')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца Adwef (стадия: adult)', 'completed', '2025-10-25 12:41:08')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца Adwef (стадия: adult)', 'completed', '2025-10-25 15:40:47')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца CVfs (стадия: adult)', 'completed', '2025-10-25 17:06:17')
    ON CONFLICT DO NOTHING;
    

    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('273065571', 'earning', 200, 0, 200, 
            'Воскрешение питомца Adwef (стадия: adult)', 'completed', '2025-10-26 08:17:17')
    ON CONFLICT DO NOTHING;
    
