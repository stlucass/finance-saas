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
        if (year != null) {
            if (month != null) {
                YearMonth yearMonth = YearMonth.of(year, month);
                LocalDate start = yearMonth.atDay(1);
                LocalDate end = yearMonth.atEndOfMonth();
                return repository.findByDateBetweenOrderByDateDesc(start, end);
            } else {
                LocalDate start = LocalDate.of(year, 1, 1);
                LocalDate end = LocalDate.of(year, 12, 31);
                return repository.findByDateBetweenOrderByDateDesc(start, end);
            }
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
        transaction.setPaid(transactionDetails.isPaid());
        transaction.setAccount(transactionDetails.getAccount());
        transaction.setCategory(transactionDetails.getCategory());
        return repository.save(transaction);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Transaction processSingleRecurrence(Long id) {
        Transaction template = repository.findById(id).orElseThrow();
        if (!template.isRecurring()) {
            throw new IllegalArgumentException("A transação não é recorrente");
        }

        // Clona a transação e salva no histórico (como transação comum)
        Transaction newTransaction = Transaction.builder()
                .description(template.getDescription())
                .amount(template.getAmount())
                .date(template.getNextRecurrenceDate() != null ? template.getNextRecurrenceDate() : LocalDate.now())
                .type(template.getType())
                .recurring(false)
                .paid(true) // Lançamentos criados via recorrência já nascem efetivados
                .account(template.getAccount())
                .category(template.getCategory())
                .build();
        repository.save(newTransaction);

        // Avança a data da próxima execução no template (+1 mês)
        LocalDate nextDate = template.getNextRecurrenceDate() != null 
                ? template.getNextRecurrenceDate() 
                : template.getDate();
        template.setNextRecurrenceDate(nextDate.plusMonths(1));
        return repository.save(template);
    }
}
