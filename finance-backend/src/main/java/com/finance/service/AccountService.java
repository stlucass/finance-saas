package com.finance.service;

import com.finance.model.Account;
import com.finance.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository repository;

    public List<Account> findAll() {
        return repository.findAll();
    }

    public Account save(Account account) {
        return repository.save(account);
    }

    public Account update(Long id, Account accountDetails) {
        Account account = repository.findById(id).orElseThrow();
        account.setName(accountDetails.getName());
        account.setBalance(accountDetails.getBalance());
        account.setInvestedAmount(accountDetails.getInvestedAmount());
        return repository.save(account);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
