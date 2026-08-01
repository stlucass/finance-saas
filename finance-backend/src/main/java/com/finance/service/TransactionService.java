package com.finance.service;

import com.finance.model.Transaction;
import com.finance.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
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

        // Avança a data da próxima execução respeitando a frequência configurada
        LocalDate nextDate = template.getNextRecurrenceDate() != null
                ? template.getNextRecurrenceDate()
                : template.getDate();
        template.setNextRecurrenceDate(calculateNextDate(nextDate, template.getRecurrenceFrequency()));
        return repository.save(template);
    }

    /**
     * Calcula a próxima data de recorrência com base na frequência configurada.
     *
     * MONTHLY         → soma +1 mês mantendo o dia (padrão)
     * LAST_DAY        → último dia do próximo mês
     * LAST_BUSINESS_DAY → último dia útil (Seg–Sex) do próximo mês
     */
    private LocalDate calculateNextDate(LocalDate from, String frequency) {
        if (frequency == null) {
            return from.plusMonths(1);
        }

        switch (frequency) {
            case "LAST_BUSINESS_DAY": {
                // Próximo mês, a partir de 'from'
                YearMonth nextMonth = YearMonth.from(from).plusMonths(1);
                // Começa no último dia do próximo mês e retrocede até um dia útil
                LocalDate candidate = nextMonth.atEndOfMonth();
                while (candidate.getDayOfWeek() == DayOfWeek.SATURDAY
                        || candidate.getDayOfWeek() == DayOfWeek.SUNDAY) {
                    candidate = candidate.minusDays(1);
                }
                return candidate;
            }
            case "LAST_DAY": {
                YearMonth nextMonth = YearMonth.from(from).plusMonths(1);
                return nextMonth.atEndOfMonth();
            }
            default:
                // "MONTHLY" ou qualquer outro valor → data fixa +1 mês
                return from.plusMonths(1);
        }
    }
}
