-- Insert sample questions for each subject
INSERT INTO questions (subject_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, year, difficulty_level)
VALUES
-- Pharmaceutical Chemistry questions
(1, 'Which functional group is responsible for the analgesic activity of acetaminophen?', 'Hydroxyl group', 'Amino group', 'Acetyl group', 'Phenyl group', 'A', 'The hydroxyl group in acetaminophen is essential for its analgesic activity through its interaction with COX enzymes.', 2024, 'medium'),
(1, 'What is the primary mechanism of action of beta-lactam antibiotics?', 'Inhibition of cell wall synthesis', 'Inhibition of protein synthesis', 'Inhibition of DNA synthesis', 'Inhibition of RNA synthesis', 'A', 'Beta-lactam antibiotics work by inhibiting bacterial cell wall synthesis by binding to PBPs.', 2023, 'easy'),
(1, 'Which isomer of adrenaline is more active?', 'L-isomer', 'D-isomer', 'Racemic mixture', 'Meso form', 'A', 'The L-isomer of adrenaline is more pharmacologically active due to better receptor binding.', 2022, 'hard'),

-- Pharmaceutics questions
(2, 'What is the purpose of adding a disintegrant to a tablet formulation?', 'To help the tablet break apart', 'To bind the ingredients together', 'To improve taste', 'To prevent moisture absorption', 'A', 'Disintegrants help tablets break apart when they come in contact with water.', 2024, 'easy'),
(2, 'Which of the following is a commonly used tablet coating polymer?', 'Hydroxypropyl methylcellulose', 'Sodium chloride', 'Calcium carbonate', 'Magnesium stearate', 'A', 'HPMC is widely used as a film-forming polymer in tablet coating.', 2023, 'medium'),
(2, 'What is the role of a plasticizer in film coating?', 'Increases flexibility', 'Increases hardness', 'Decreases adhesion', 'Increases brittleness', 'A', 'Plasticizers improve the flexibility of film coatings and prevent cracking.', 2022, 'medium'),

-- Pharmacology questions
(3, 'Which neurotransmitter is primarily involved in the pathophysiology of Parkinson\'s disease?', 'Dopamine', 'Serotonin', 'GABA', 'Acetylcholine', 'A', 'Dopamine deficiency in the substantia nigra is the primary cause of Parkinson\'s disease.', 2024, 'medium'),
(3, 'What is the mechanism of action of ACE inhibitors?', 'Blocks angiotensin converting enzyme', 'Blocks calcium channels', 'Blocks sodium channels', 'Blocks potassium channels', 'A', 'ACE inhibitors work by blocking the conversion of angiotensin I to angiotensin II.', 2023, 'easy'),
(3, 'Which of the following is a selective β2-agonist?', 'Salbutamol', 'Propranolol', 'Prazosin', 'Clonidine', 'A', 'Salbutamol selectively activates β2-adrenergic receptors in bronchial smooth muscle.', 2022, 'medium'),

-- Pharmacognosy questions
(4, 'Which alkaloid is found in Rauwolfia serpentina?', 'Reserpine', 'Morphine', 'Quinine', 'Atropine', 'A', 'Reserpine is the primary alkaloid found in Rauwolfia serpentina used as an antihypertensive.', 2024, 'medium'),
(4, 'What is the source of digoxin?', 'Digitalis purpurea', 'Atropa belladonna', 'Ephedra sinica', 'Cinchona officinalis', 'A', 'Digoxin is obtained from the leaves of Digitalis purpurea (foxglove).', 2023, 'easy'),
(4, 'Which plant contains artemisinin?', 'Artemisia annua', 'Cinchona officinalis', 'Papaver somniferum', 'Cannabis sativa', 'A', 'Artemisinin, an antimalarial drug, is obtained from Artemisia annua (sweet wormwood).', 2022, 'hard');
