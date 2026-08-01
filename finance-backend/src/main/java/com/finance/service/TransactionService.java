package com.finance.service;

import com.finance.model.Transaction;
import com.finance.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository repository;

    public List<Transaction> findAll(Integer month, Integer year) {
        if (month != null && year != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            LocalDate start = yearMonth.atDay(1);
            LocalDate end = yearMonth.atEndOfMonth();
            return repository.findByDateBetweenOrderByDateDesc(start, end);
        }
        return repository.findAllByOrderByDateDesc();
    }

    public Transaction save(Transaction transaction) {
        if (transaction.isRecurring() && transaction.getNextRecurrenceDate() == null) {
            transaction.setNextRecurrenceDate(transaction.getDate().plusMonths(1));
        }
        return repository.save(transaction);
    }

    public Transaction update(Long id, Transaction transactionDetails) {
        Transaction transaction = repository.findById(id).orElseThrow();
        transaction.setDescription(transactionDetails.getDescription());
        transaction.setAmount(transactionDetails.getAmount());
        transaction.setDate(transactionDetails.getDate());
        transaction.setType(transactionDetails.getType());
        
        // Se mudou de nao-recorrente para recorrente
        if (transactionDetails.isRecurring() && !transaction.isRecurring()) {
            transaction.setNextRecurrenceDate(transactionDetails.getDate().plusMonths(1));
        } else if (!transactionDetails.isRecurring()) {
            transaction.setNextRecurrenceDate(null);
        }
        
        transaction.setRecurring(transactionDetails.isRecurring());
        transaction.setRecurrenceFrequency(transactionDetails.getRecurrenceFrequency());
        transaction.setAccount(transactionDetails.getAccount());
        transaction.setCategory(transactionDetails.getCategory());
        return repository.save(transaction);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
